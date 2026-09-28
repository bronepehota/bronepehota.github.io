#!/usr/bin/env python3
"""Механическая нормализация русской типографики в lore-корпусе.

Порт src/lib/text-format.ts → normalizeRussianTypography (один-в-один):
  \\r\\n → \\n; [ \\t]{2,} → ' '; \\.{3} → …; парные " → «…»; (\\s)-(\\s) → —; trim.
«ё» намеренно НЕ трогается — словарная правка ё/е отдельная (редакторский проход).

Правятся ТОЛЬКО белые списки полей:
  - юниты (src/data/encyclopedia/units/*/{squads,machines}.json):
      encyclopedia.{class,lore,history,tactics,traditions,shortDescription},
      encyclopedia.keyBattles[].{description,outcome},
      encyclopedia.locations[].description,
      encyclopedia.armament[].notes
    (spec-поля машин — manufacturer/mass/crew/type/monoblock/designation/sourceUrl —
     и прочие строки НЕ трогаются)
  - фракции (src/data/encyclopedia/factions.json): description, shortDescription
  - миссии (src/data/missions/missions.json): setup, summary, tagline,
      briefing.{setting,order,report}, objectives[*].text, specialRules[]

Как правим: НЕ полной пересериализацией (в миссиях и части squad-файлов претиер-стиль
со однострочными массивами/объектами — json.dump выдал бы структурный шум), а точечной
заменой литералов строк по позициям в исходном тексте. Итог: байт-в-байт меняются
только правленые строковые значения, форматирование/порядок ключей/отступы — нет.

Режимы:
  python3 tools/normalize_lore_typography.py FILE...            # нормализация (запись только при изменениях)
  python3 tools/normalize_lore_typography.py --dry-run FILE...  # показать план правок, не писать
  python3 tools/normalize_lore_typography.py --check-serialization FILE...
        # round-trip проверка сериализации: json.dump(indent=2, ensure_ascii=False)+\\n.
        # Пустой `git diff` после прогона на файле = сериализация совпадает.

Выход: 0 — ок; 2 — ошибка разбора/несовпадение структуры (запись не выполняется).
"""

from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Правила типографики (порт normalizeRussianTypography из src/lib/text-format.ts)
# ---------------------------------------------------------------------------

# JS \s (RegExp, non-unicode mode) — чтобы порт вёл себя идентично рантайму.
JS_WS = "\t\n\r\f\v    -     　﻿"

RX_CRLF = re.compile(r"\r\n")
RX_SPACES = re.compile("[ \\t]{2,}")
RX_ELLIPSIS = re.compile(r"\.{3}")
RX_QUOTES = re.compile(r'"([^"\n]+)"')
RX_DASH = re.compile(r"([" + JS_WS + r"])-([" + JS_WS + r"])")

RULES = (
    ("crlf", lambda t: RX_CRLF.sub("\\n", t)),
    ("spaces", lambda t: RX_SPACES.sub(" ", t)),
    ("ellipsis", lambda t: RX_ELLIPSIS.sub("…", t)),
    ("quotes", lambda t: RX_QUOTES.sub("«\\1»", t)),
    ("dash", lambda t: RX_DASH.sub("\\1—\\2", t)),
)


def normalize(text: str) -> tuple[str, list[str]]:
    """Возвращает (нормализованный текст, список сработавших правил)."""
    applied: list[str] = []
    out = text
    for name, fn in RULES:
        new = fn(out)
        if new != out:
            applied.append(name)
            out = new
    stripped = out.strip()
    if stripped != out:
        applied.append("trim")
        out = stripped
    return out, applied


# ---------------------------------------------------------------------------
# Белые списки полей
# ---------------------------------------------------------------------------

UNIT_STR_FIELDS = {"class", "lore", "history", "tactics", "traditions", "shortDescription"}
KEY_BATTLE_FIELDS = {"description", "outcome"}
FACTION_FIELDS = {"description", "shortDescription"}
MISSION_TOP = {"setup", "summary", "tagline"}
BRIEFING_FIELDS = {"setting", "order", "report"}


def match_units(path: tuple) -> bool:
    """path — кортеж ключей/индексов от корня файла юнитов."""
    if len(path) == 3 and path[1] == "encyclopedia" and path[2] in UNIT_STR_FIELDS:
        return True
    if len(path) == 5 and path[1] == "encyclopedia":
        coll, idx, leaf = path[2], path[3], path[4]
        if coll == "keyBattles" and isinstance(idx, int) and leaf in KEY_BATTLE_FIELDS:
            return True
        if coll == "locations" and isinstance(idx, int) and leaf == "description":
            return True
        if coll == "armament" and isinstance(idx, int) and leaf == "notes":
            return True
    return False


def match_factions(path: tuple) -> bool:
    return len(path) == 2 and isinstance(path[1], str) and path[1] in FACTION_FIELDS


def match_missions(path: tuple) -> bool:
    if len(path) == 2 and isinstance(path[1], str) and path[1] in MISSION_TOP:
        return True
    if len(path) == 3 and path[1] == "briefing" and path[2] in BRIEFING_FIELDS:
        return True
    if len(path) == 4 and path[1] == "objectives" and path[3] == "text":
        return True
    if len(path) == 3 and path[1] == "specialRules" and isinstance(path[2], int):
        return True
    return False


def matcher_for(path: Path):
    resolved = path.name
    if resolved == "factions.json":
        return match_factions
    if resolved == "missions.json":
        return match_missions
    return match_units  # units/*/{squads,machines}.json и будущие файлы юнитов


# ---------------------------------------------------------------------------
# Позиционный сканер JSON: собирает строковые значения с их span-ами в тексте.
# ---------------------------------------------------------------------------

JSON_WS = " \t\n\r"


class ScanError(ValueError):
    pass


class StringSpanScanner:
    """Рекурсивный спуск по JSON-тексту: парсит и запоминает (path, start, end, value)
    для каждого СТРОКОВОГО значения (ключи объектов не записываются — они не правятся).
    Результат разбора сверяется с json.loads исходника — страховка от собственного бага."""

    def __init__(self, text: str):
        self.s = text
        self.n = len(text)
        self.i = 0
        self.strings: list[tuple[tuple, int, int, str]] = []

    def _ws(self) -> None:
        while self.i < self.n and self.s[self.i] in JSON_WS:
            self.i += 1

    def _fail(self, msg: str) -> "ScanError":
        line = self.s.count("\n", 0, self.i) + 1
        return ScanError(f"{msg} (строка {line}, смещение {self.i})")

    def parse(self):
        self._ws()
        value = self._value(())
        self._ws()
        if self.i != self.n:
            raise self._fail("лишние данные после конца JSON")
        return value

    def _peek(self) -> str:
        if self.i >= self.n:
            raise self._fail("неожиданный конец файла")
        return self.s[self.i]

    def _value(self, path: tuple):
        self._ws()
        c = self._peek()
        if c == "{":
            return self._object(path)
        if c == "[":
            return self._array(path)
        if c == '"':
            return self._string(path)
        return self._literal(path)

    def _object(self, path: tuple):
        obj = {}
        self.i += 1  # {
        self._ws()
        if self._peek() == "}":
            self.i += 1
            return obj
        while True:
            self._ws()
            if self._peek() != '"':
                raise self._fail("ключ объекта должен быть строкой")
            key = self._string((), is_key=True)
            self._ws()
            if self._peek() != ":":
                raise self._fail("ожидалось ':' после ключа")
            self.i += 1
            obj[key] = self._value(path + (key,))
            self._ws()
            c = self._peek()
            if c == ",":
                self.i += 1
                continue
            if c == "}":
                self.i += 1
                return obj
            raise self._fail("ожидались ',' или '}'")

    def _array(self, path: tuple):
        arr = []
        self.i += 1  # [
        self._ws()
        if self._peek() == "]":
            self.i += 1
            return arr
        idx = 0
        while True:
            arr.append(self._value(path + (idx,)))
            idx += 1
            self._ws()
            c = self._peek()
            if c == ",":
                self.i += 1
                continue
            if c == "]":
                self.i += 1
                return arr
            raise self._fail("ожидались ',' или ']'")

    def _string(self, path: tuple, is_key: bool = False) -> str:
        start = self.i
        j = start + 1
        while True:
            if j >= self.n:
                self.i = j
                raise self._fail("незакрытая строка")
            c = self.s[j]
            if c == "\\":
                j += 2
                continue
            if c == '"':
                break
            j += 1
        end = j + 1
        self.i = end
        value = json.loads(self.s[start:end])
        if not is_key:
            self.strings.append((path, start, end, value))
        return value

    def _literal(self, path: tuple):
        start = self.i
        while self.i < self.n and self.s[self.i] not in ",]} \t\n\r:":
            self.i += 1
        raw = self.s[start : self.i]
        if not raw:
            raise self._fail("ожидалось значение")
        return json.loads(raw)


# ---------------------------------------------------------------------------
# Прогон по файлам
# ---------------------------------------------------------------------------


def plan_edits(raw: str, matcher):
    """Разбирает файл, возвращает (data, edits, scanned_values).
    edits: список (start, end, новый_литерал, path, applied_rules)."""
    scanner = StringSpanScanner(raw)
    data = scanner.parse()
    if data != json.loads(raw):
        raise ScanError("внутренняя ошибка: сканер разошёлся с json.loads")
    edits = []
    for path, start, end, value in scanner.strings:
        if not isinstance(value, str) or not matcher(path):
            continue
        new, applied = normalize(value)
        if new != value:
            literal = json.dumps(new, ensure_ascii=False)
            edits.append((start, end, literal, path, applied))
    return data, edits, scanner.strings


def apply_edits(raw: str, edits) -> str:
    out = []
    prev = 0
    for start, end, literal, _path, _applied in edits:
        out.append(raw[prev:start])
        out.append(literal)
        prev = end
    out.append(raw[prev:])
    return "".join(out)


def process(path: Path, dry_run: bool, stats: dict) -> bool:
    raw = path.read_text(encoding="utf-8")
    try:
        data, edits, strings = plan_edits(raw, matcher_for(path))
    except ScanError as exc:
        print(f"ОШИБКА {path}: {exc}", file=sys.stderr)
        return False

    per_rule: dict = {}
    for _s, _e, _lit, _p, applied in edits:
        for rule in applied:
            per_rule[rule] = per_rule.get(rule, 0) + 1
    stats[str(path)] = {
        "values_scanned": len(strings),
        "values_changed": len(edits),
        "by_rule": per_rule,
        "edits": [(p, a) for _s, _e, _l, p, a in edits],
    }

    if not edits:
        print(f"{path}: 0 правок ({len(strings)} строковых значений, уже норма)")
        return True

    new_text = apply_edits(raw, edits)
    expected = copy.deepcopy(data)
    for _s, _e, _lit, p, _a in edits:
        node = expected
        for key in p[:-1]:
            node = node[key]
        node[p[-1]] = json.loads(_lit)
    if json.loads(new_text) != expected:
        print(f"ОШИБКА {path}: результат правки не совпал с ожидаемым — запись отменена", file=sys.stderr)
        return False

    if dry_run:
        print(f"{path}: [dry-run] правок: {len(edits)}, по правилам: {per_rule}")
        for p, applied in stats[str(path)]["edits"]:
            print(f"    {'.'.join(str(x) for x in p)}: {','.join(applied)}")
        return True

    path.write_text(new_text, encoding="utf-8")
    print(f"{path}: правок: {len(edits)}, по правилам: {per_rule}")
    return True


def check_serialization(path: Path) -> bool:
    """Round-trip проверка: json.dump(indent=2, ensure_ascii=False) + \\n совпадает с файлом."""
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    dumped = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if dumped == raw:
        print(f"{path}: сериализация совпадает")
        return True
    path.write_text(dumped, encoding="utf-8")
    print(f"{path}: сериализация ОТЛИЧАЕТСЯ — файл переписан (git diff покажет объём шума)")
    return False


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("files", nargs="+", type=Path)
    ap.add_argument("--dry-run", action="store_true", help="показать план правок, не писать файлы")
    ap.add_argument(
        "--check-serialization",
        action="store_true",
        help="round-trip проверка сериализации (json.dump indent=2) вместо нормализации",
    )
    args = ap.parse_args(argv)

    ok = True
    if args.check_serialization:
        for f in args.files:
            ok = check_serialization(f) and ok
        return 0 if ok else 1

    stats: dict = {}
    for f in args.files:
        if not f.exists():
            print(f"ОШИБКА {f}: файл не найден", file=sys.stderr)
            ok = False
            continue
        ok = process(f, args.dry_run, stats) and ok

    if not args.dry_run:
        total = sum(s["values_changed"] for s in stats.values())
        scanned = sum(s["values_scanned"] for s in stats.values())
        print(f"итого: файлов {len(stats)}, строковых значений просканировано {scanned}, изменено {total}")
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
