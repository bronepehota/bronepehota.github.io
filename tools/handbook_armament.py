#!/usr/bin/env python3
"""Extract per-machine weapon blocks from the Справочник техники PDF text.

Pipeline: pdftotext -raw (mojibake: cp1251 read as latin-1, re-encoded UTF-8),
then a per-char roundtrip: chars <= U+00FF become bytes, real Unicode passes
through; the byte stream decodes back as cp1251. Finds "Вооружение ... «Name»"
headers and the "-- " weapon entries under them; prints a JSON skeleton for
manual curation into machines.json (armament/designation).

Usage:
  pdftotext -raw ~/Documents/BP/Spravochnik_tekhniki_robogir.pdf /tmp/handbook.txt
  python3 tools/handbook_armament.py /tmp/handbook.txt > /tmp/armament.json
"""
import json
import re
import sys


def decode_roundtrip(text: str) -> str:
    res, buf = [], bytearray()
    for ch in text:
        o = ord(ch)
        if o <= 0xFF:
            buf.append(o)
        else:
            if buf:
                res.append(bytes(buf).decode('cp1251', errors='replace'))
                buf = bytearray()
            res.append(ch)
    if buf:
        res.append(bytes(buf).decode('cp1251', errors='replace'))
    return ''.join(res)


def main(path: str) -> None:
    raw = open(path, encoding='utf-8').read()
    t = decode_roundtrip(raw)
    sections = []
    for m in re.finditer(r'Вооружение[^\n]*?«([^»]+)»[^\n]*\n', t):
        chunk = t[m.end():m.end() + 6000]
        weapons = []
        for e in re.finditer(r'--\s+([^\n]+)\n((?:(?!--\s|\n\s*\n)[^\n]*\n?)*)', chunk):
            first = ' '.join(e.group(1).split())
            desc = ' '.join(e.group(2).split())
            if first:
                weapons.append({'first_line': first, 'description': desc[:500]})
        if weapons:
            sections.append({'machine_ru': m.group(1), 'weapons': weapons})
    print(json.dumps(sections, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/handbook.txt')
