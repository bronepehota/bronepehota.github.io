#!/usr/bin/env python3
"""
Extract structured ТТХ + weapon lists from «Справочник техники Робогир» (PDF).

Tuned for this PDF's quirks:
  - Adobe InDesign 2.0 ToUnicode bug → text comes out as CP1251-as-Latin1 mojibake.
    We re-decode: every char in U+0000–U+00FF is a raw byte → cp1251. High Unicode
    (–, —, «, »…) is preserved as-is.
  - The spec blocks are positioned text (not real PDF tables), interleaved with
    machine-diagram callouts — so we parse label/value by known spec labels
    (Класс/Тип/Разработчик/Моноблок/Масса/Экипаж) + `--` weapon bullets.

Usage:
    python3 tools/handbook_extract.py path/to/Spravochnik.pdf
    python3 tools/handbook_extract.py path/to/Spravochnik.pdf --json   # machine -> {specs, weapons}

Re-runnable; safe to re-point at another same-format Tehnolog handbook.
"""
import sys
import re
import json
import pdfplumber

SPEC = ['Класс', 'Тип', 'Разработчик', 'Моноблок', 'Масса', 'Вес', 'Экипаж']
KNOWN = set(SPEC) | {'Вооружение'}


def fix_mojibake(s: str) -> str:
    """Re-deode CP1251-as-Latin1 mojibake; keep high Unicode (–, «, ») intact."""
    out, buf = [], bytearray()

    def flush():
        if buf:
            out.append(bytes(buf).decode('cp1251', 'replace'))
            buf.clear()

    for c in s:
        if ord(c) <= 0xFF:
            buf.append(ord(c))
        else:
            flush()
            out.append(c)
    flush()
    return ''.join(out)


def extract(path: str):
    with pdfplumber.open(path) as pdf:
        raw = '\n'.join((p.extract_text() or '') for p in pdf.pages)
    text = fix_mojibake(raw)

    headers = [(m.start(), m.group(1))
               for m in re.finditer(r'Вооружение[^\n]*?«([^»]+)»', text)]
    headers.append((len(text), None))

    machines = []
    for i, (pos, name) in enumerate(headers[:-1]):
        body = text[pos:headers[i + 1][0]]
        lines = [l.strip() for l in body.splitlines() if l.strip()]
        weps = [l.lstrip('- ').strip() for l in lines if l.startswith('--')]
        specs = {}
        for j, l in enumerate(lines):
            if l in SPEC and l not in specs:
                vals, k = [], j + 1
                while k < len(lines) and lines[k] not in KNOWN and not lines[k].startswith('--'):
                    vals.append(lines[k])
                    k += 1
                if vals:
                    specs[l] = ' '.join(vals)
        machines.append({'name': name, 'specs': specs, 'weapons': weps})
    return machines


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    path = sys.argv[1]
    as_json = '--json' in sys.argv
    machines = extract(path)
    if as_json:
        print(json.dumps(machines, ensure_ascii=False, indent=2))
        return
    print(f'# {len(machines)} machine sections\n')
    for m in machines:
        print(f"## {m['name']}")
        for k in ['Класс', 'Тип', 'Разработчик', 'Моноблок', 'Масса', 'Экипаж']:
            if k in m['specs']:
                print(f"  {k}: {m['specs'][k][:60]}")
        if m['weapons']:
            print('  Оружие: ' + ' | '.join(w[:40] for w in m['weapons']))
        print()


if __name__ == '__main__':
    main()
