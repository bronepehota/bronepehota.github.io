#!/usr/bin/env python3
"""Верификатор корпусных JSON после редакторского прогона (Task 9).

Проверяет файлы лора (юниты энциклопедии, фракции, миссии) после ручной
редактуры: структура не тронута, типографика не испорчена, большие поля
разбиты на абзацы.

Проверки:
  (а) JSON валиден (рабочее дерево и эталон HEAD);
  (б) множество id записей и СОСТАВ КЛЮЧЕЙ каждой записи идентичны
      `git show HEAD:<path>` — значения могут меняться, структура нет.
      «Состав ключей» = полная сигнатура структуры записи: все пути
      ключей (включая индексы массивов, т.е. и длины массивов) + типы
      листьев. Расхождение = ERROR с перечнем путей;
  (в) каждое поле белого списка длиннее 400 знаков содержит "\\n\\n"
      (иначе WARN: запись/поле/длина);
  (г) в полях белого списка нет прямых кавычек U+0022, окружённых
      пробелами дефисов (regex \\s-\\s) и трёх точек "..." (иначе ERROR).

Выход: 0 — ошибок нет (WARN допустим); 1 — есть ERROR.

Usage:
  python3 tools/verify_lore_corpus.py [FILE...]
  # без аргументов — весь дефолтный корпус:
  #   src/data/encyclopedia/units/{protectorate,polaris,mercenaries,
  #       rutenia,dead_fleet,snow_wolves}/{squads,machines}.json
  #   src/data/encyclopedia/factions.json
  #   src/data/missions/missions.json

Только чтение: файлы рабочей копии + `git show`/`git rev-parse` через
subprocess. Никаких записей в git, никаких внешних зависимостей (stdlib).
Матчеры белого списка переиспользуются из tools/normalize_lore_typography.py
(та же логика путей, что у нормализатора — один источник истины).
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from normalize_lore_typography import matcher_for  # noqa: E402  (матчеры белых списков)

# ---------------------------------------------------------------------------
# Конфигурация
# ---------------------------------------------------------------------------

UNIT_FACTIONS = (
    "protectorate",
    "polaris",
    "mercenaries",
    "rutenia",
    "dead_fleet",
    "snow_wolves",
)
DEFAULT_FILES = tuple(
    f"src/data/encyclopedia/units/{faction}/{kind}.json"
    for faction in UNIT_FACTIONS
    for kind in ("squads", "machines")
) + (
    "src/data/encyclopedia/factions.json",
    "src/data/missions/missions.json",
)

PARA_MIN_LEN = 400          # (в) порог длины, знаков
RX_SPACED_DASH = re.compile(r"\s-\s")   # (г) " - "
MAX_DIFF_LINES = 6          # максимум путей в детализации одного расхождения
SNIPPET_WIDTH = 24          # контекст вокруг запрещённого символа


# ---------------------------------------------------------------------------
# Git (только чтение)
# ---------------------------------------------------------------------------


def git_output(args: list[str], cwd: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        ["git", *args], cwd=str(cwd), capture_output=True, check=False
    )


def git_toplevel(start: Path) -> Path:
    proc = git_output(["rev-parse", "--show-toplevel"], start if start.is_dir() else start.parent)
    if proc.returncode != 0:
        raise RuntimeError(
            "не удалось определить корень git-репозитория: "
            + proc.stderr.decode("utf-8", "replace").strip()
        )
    return Path(proc.stdout.decode("utf-8").strip())


def git_show_head(root: Path, rel: str) -> tuple[bytes | None, str | None]:
    """Содержимое файла из HEAD. (None, ошибка) — если прочесть не удалось."""
    proc = git_output(["show", f"HEAD:{rel}"], root)
    if proc.returncode != 0:
        return None, proc.stderr.decode("utf-8", "replace").strip() or "нет в HEAD"
    return proc.stdout, None


# ---------------------------------------------------------------------------
# Структура записей: подписи и сравнение
# ---------------------------------------------------------------------------


def type_name(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "bool"
    if isinstance(value, str):
        return "str"
    if isinstance(value, float):
        return "num"
    if isinstance(value, int):
        return "num"
    return type(value).__name__


def fmt_keypath(parts: tuple) -> str:
    out = ""
    for part in parts:
        if isinstance(part, int):
            out = f"{out}[{part}]"
        else:
            out = f"{out}.{part}" if out else str(part)
    return out


def structure_signature(node, prefix: tuple = ()) -> list[str]:
    """Полная структурная сигнатура: путь каждого листа + его тип.
    Индексы массивов входят в путь => изменение длины/порядка массива ловится."""
    out: list[str] = []
    if isinstance(node, dict):
        for key in node:
            out.extend(structure_signature(node[key], prefix + (key,)))
    elif isinstance(node, list):
        for idx, item in enumerate(node):
            out.extend(structure_signature(item, prefix + (idx,)))
    else:
        out.append(f"{fmt_keypath(prefix)} <{type_name(node)}>")
    return out


def record_labels(data) -> list[str]:
    """Метки записей верхнего уровня: id записи, иначе #index=i."""
    if not isinstance(data, list):
        return ["<файл целиком>"]
    labels = []
    for idx, item in enumerate(data):
        rid = item.get("id") if isinstance(item, dict) else None
        labels.append(str(rid) if isinstance(rid, str) and rid else f"#index={idx}")
    return labels


def diff_paths(head_sig: list[str], wt_sig: list[str]) -> tuple[list[str], list[str]]:
    head_set, wt_set = set(head_sig), set(wt_sig)
    return sorted(head_set - wt_set), sorted(wt_set - head_set)


# ---------------------------------------------------------------------------
# Обход белого списка
# ---------------------------------------------------------------------------


def walk_whitelist(node, matcher, prefix: tuple = ()):
    """Итерация (путь, значение) по строковым полям белого списка.
    Пути — в конвенции normalize_lore_typography (ключи str, индексы int)."""
    if isinstance(node, dict):
        for key in node:
            yield from walk_whitelist(node[key], matcher, prefix + (key,))
    elif isinstance(node, list):
        for idx, item in enumerate(node):
            yield from walk_whitelist(item, matcher, prefix + (idx,))
    else:
        if isinstance(node, str) and matcher(prefix):
            yield prefix, node


def fmt_field(path: tuple, labels: list[str]) -> str:
    """Человекочитаемый путь поля: «id записи › остальной.путь»."""
    if path and isinstance(path[0], int) and path[0] < len(labels):
        head = labels[path[0]]
        rest = fmt_keypath(path[1:])
        return f"{head} › {rest}" if rest else head
    return fmt_keypath(path)


def snippet(value: str, pos: int) -> str:
    start = max(0, pos - SNIPPET_WIDTH)
    end = min(len(value), pos + SNIPPET_WIDTH + 1)
    ctx = value[start:end].replace("\n", "\\n").replace("\r", "\\r")
    return ("…" if start > 0 else "") + ctx + ("…" if end < len(value) else "")


# ---------------------------------------------------------------------------
# Проверка одного файла
# ---------------------------------------------------------------------------


def verify_file(root: Path, rel: str) -> dict:
    res = {"rel": rel, "errors": [], "warns": [], "records": 0, "whitelist": 0}

    abs_path = root / rel
    if not abs_path.is_file():
        print(f"\n— {rel}")
        print("    ОШИБКА (а): файл отсутствует в рабочем дереве")
        res["errors"].append("(а) файл отсутствует в рабочем дереве")
        return res

    try:
        raw = abs_path.read_bytes().decode("utf-8")
        data = json.loads(raw)
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"\n— {rel}")
        print(f"    ОШИБКА (а): JSON невалиден: {exc}")
        res["errors"].append(f"(а) JSON невалиден: {exc}")
        return res

    head_raw, git_err = git_show_head(root, rel)
    print(f"\n— {rel}")
    if head_raw is None:
        print(f"    ОШИБКА (б): нет эталона HEAD: {git_err}")
        res["errors"].append(f"(б) нет эталона HEAD: {git_err}")
        return res
    try:
        head_data = json.loads(head_raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        print(f"    ОШИБКА (б): эталон HEAD — невалидный JSON: {exc}")
        res["errors"].append(f"(б) эталон HEAD — невалидный JSON: {exc}")
        return res

    print("    (а) JSON: ОК (рабочее дерево и HEAD)")

    # ---- (б) структура относительно HEAD ---------------------------------
    labels = record_labels(data)
    head_labels = record_labels(head_data)
    res["records"] = len(labels)

    wt_label_set = set(labels)
    head_label_set = set(head_labels)
    only_head_ids = [lb for lb in head_labels if lb not in wt_label_set]
    only_wt_ids = [lb for lb in labels if lb not in head_label_set]

    by_head = dict(zip(head_labels, (structure_signature(r) for r in _iter_records(head_data))))
    by_wt = dict(zip(labels, (structure_signature(r) for r in _iter_records(data))))

    key_diffs: list[tuple[str, list[str], list[str]]] = []
    for label in labels:
        if label in by_head:
            gone, added = diff_paths(by_head[label], by_wt[label])
            if gone or added:
                key_diffs.append((label, gone, added))

    if only_head_ids or only_wt_ids or key_diffs:
        print("    (б) структура относительно HEAD: ОШИБКА")
        if only_head_ids:
            res["errors"].append(
                "(б) записи пропали относительно HEAD: " + ", ".join(only_head_ids)
            )
            print(f"        записи пропали: {', '.join(only_head_ids)}")
        if only_wt_ids:
            res["errors"].append(
                "(б) записи добавлены относительно HEAD: " + ", ".join(only_wt_ids)
            )
            print(f"        записи добавлены: {', '.join(only_wt_ids)}")
        for label, gone, added in key_diffs:
            detail: list[str] = []
            if gone:
                shown = gone[:MAX_DIFF_LINES]
                detail.append(
                    f"пути только в HEAD ({len(gone)}): "
                    + "; ".join(shown)
                    + (f"; … ещё {len(gone) - MAX_DIFF_LINES}" if len(gone) > MAX_DIFF_LINES else "")
                )
            if added:
                shown = added[:MAX_DIFF_LINES]
                detail.append(
                    f"новые пути ({len(added)}): "
                    + "; ".join(shown)
                    + (f"; … ещё {len(added) - MAX_DIFF_LINES}" if len(added) > MAX_DIFF_LINES else "")
                )
            msg = f"(б) состав ключей записи «{label}» изменился: " + " | ".join(detail)
            res["errors"].append(msg)
            print(f"        запись «{label}»: состав ключей изменился")
            for line in detail:
                print(f"            {line}")
    else:
        print(f"    (б) структура относительно HEAD: ОК (записей: {len(labels)})")

    # ---- (в) и (г) по белому списку ---------------------------------------
    matcher = matcher_for(abs_path)
    fields = list(walk_whitelist(data, matcher))
    res["whitelist"] = len(fields)

    para_warns: list[str] = []
    char_errors: list[str] = []

    for path, value in fields:
        shown = fmt_field(path, labels)
        # (г) запрещённые символы — ERROR
        bad: list[str] = []
        pos = value.find('"')
        if pos != -1:
            bad.append(f'прямая кавычка U+0022 …{snippet(value, pos)}…')
        m = RX_SPACED_DASH.search(value)
        if m:
            bad.append(f'" - " дефис с пробелами …{snippet(value, m.start())}…')
        pos = value.find("...")
        if pos != -1:
            bad.append(f'"..." три точки …{snippet(value, pos)}…')
        if bad:
            for item in bad:
                char_errors.append(f"{shown}: {item}")
                res["errors"].append(f"(г) {shown}: {item}")

        # (в) длинные поля без \n\n — WARN
        if len(value) > PARA_MIN_LEN and "\n\n" not in value:
            para_warns.append(f"{shown}: длина {len(value)} зн., абзацев нет (\\n\\n)")
            res["warns"].append(f"(в) {shown}: длина {len(value)}, нет \\n\\n")

    if char_errors:
        print(f"    (г) типографика белого списка: ОШИБКА ({len(char_errors)})")
        for line in char_errors:
            print(f"        {line}")
    else:
        print(f"    (г) типографика белого списка: ОК ({len(fields)} полей)")

    if para_warns:
        print(f"    (в) абзацы: ВНИМАНИЕ ({len(para_warns)} полей > {PARA_MIN_LEN} зн. без \\n\\n)")
        for line in para_warns:
            print(f"        {line}")
    else:
        print(f"    (в) абзацы: ОК")

    return res


def _iter_records(data):
    if isinstance(data, list):
        yield from data
    else:
        yield data


# ---------------------------------------------------------------------------
# Точка входа
# ---------------------------------------------------------------------------


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(
        description="Верификация корпусных JSON после редакторского прогона (Task 9)"
    )
    parser.add_argument(
        "files",
        nargs="*",
        help="пути к JSON-файлам корпуса (по умолчанию — весь дефолтный корпус)",
    )
    args = parser.parse_args(argv)

    rel_paths: list[str] = []
    root: Path | None = None
    for given in args.files or DEFAULT_FILES:
        abs_path = Path(given).resolve()
        if not abs_path.exists():
            print(f"ОШИБКА: путь не найден: {given}")
            return 1
        try:
            file_root = git_toplevel(abs_path)
            rel_paths.append(str(abs_path.relative_to(file_root)))
            root = root or file_root
        except (ValueError, RuntimeError) as exc:
            print(f"ОШИБКА: {given}: {exc}")
            return 1

    results = []
    for rel in rel_paths:
        results.append(verify_file(root, rel))

    files_n = len(results)
    records_n = sum(r["records"] for r in results)
    whitelist_n = sum(r["whitelist"] for r in results)
    warns_n = sum(len(r["warns"]) for r in results)
    errors_n = sum(len(r["errors"]) for r in results)

    print("\n" + "=" * 72)
    print(
        f"ИТОГО: файлов {files_n}, записей {records_n}, "
        f"полей белого списка {whitelist_n}, "
        f"ВНИМАНИЙ (WARN) {warns_n}, ОШИБОК (ERROR) {errors_n}"
    )
    if errors_n:
        print("Статус: ПРОВАЛ — есть ERROR (см. выше)")
    elif warns_n:
        print("Статус: ПРОШЕЛ с замечаниями (WARN допустим, ERROR нет)")
    else:
        print("Статус: ПРОШЕЛ полностью")
    print("=" * 72)

    return 1 if errors_n else 0


if __name__ == "__main__":
    sys.exit(main())
