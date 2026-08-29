#!/usr/bin/env python3
"""Анти-копипаст-чекер энциклопедии: жадные n-граммы слов.

Инвариант проекта (решение владельца 2026-08-28): опубликованный лор — авторские
адаптации, дословные тексты первоисточников не воспроизводятся. Норма: не более
11 совпадающих слов подряд с любым первоисточником (или между двумя любыми
опубликованными сущностями). Чекер находит МАКСИМАЛЬНУЮ длину общего
подряд-идущего слова-рана и падает, если она >= порога (по умолчанию 12).

Нормализация: нижний регистр, ё→е, пунктуация НЕ ррвёт ран (выбрасывается),
слова = последовательности букв/цифр. YAML-frontmatter отбрасывается.

Режимы:
  --self-check                Контент против самого себя (крест-накрест, пары
                              файлов): разные сущности не должны совпадать >=
                              порога — ловит внутренние копипасты. Единственный
                              режим, доступный в CI без первоисточников.
  --content GLOB --sources GLOB
                              Полный чек: каждый контент-файл против каждого
                              файла-источника. Так запускают локальную проверку
                              против первоисточников (см. «Локальный полный
                              прогон» ниже).

Локальный полный прогон (в CI недоступно — источники вне репозитория):

  # 1) Рассказы robogear.ru — дословные архивы ЗАКОММИЧЕНЫ в docs/ (вне сборки),
  #    доступно и в CI:
  python3 tools/check_copy_paste.py \
      --content 'src/content/history/*.md' \
      --sources 'docs/lore-sources/robogear-stories/*.md'

  # 2) PDF-издания (~/Documents/BP и ~/Documents/pict) — прогнать через
  #    pdftotext и сверить (см. docs/ENCYCLOPEDIA_LORE_SOURCES.md, шпаргалка):
  pdftotext -layout ~/Documents/BP/LETOPIS_-_ZVEZDNYE_GEROI.pdf /tmp/letopis.txt
  python3 tools/check_copy_paste.py \
      --content 'src/content/{history,campaigns,world}/**/*.md' \
      --sources '/tmp/sources/*.txt'

  # 3) Веб-справочник robogear.ru («Описание войск», чистые копии когда-то
  #     лежали в /tmp/robogear-voiska/*.clean.md — перегенерировать при need):
  python3 tools/check_copy_paste.py \
      --content 'src/data/encyclopedia/units/**/*.json' \
      --sources '/tmp/robogear-voiska/*.clean.md'

Выход: 0 — норма выдержана; 1 — найден ран >= порога (печатаются файлы, длина
и сами совпавшие слова). --json — машинный отчёт.
"""

from __future__ import annotations

import argparse
import glob as globmod
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

# Ран короче якоря не ищем: 6 слов — достаточно уникально для естественной речи,
# и заметно быстрее, чем якорь в 1-2 слова (много ложных кандидатов).
ANCHOR_LEN = 6
# Порог: инвариант «≤11 совпадающих слов подряд» => падаем на 12-м.
DEFAULT_THRESHOLD = 12

WORD_RE = re.compile(r"[0-9a-zа-я]+")

# Имена frontmatter-полей не считаем текстом — нормализация отбрасывает весь
# frontmatter целиком (до закрывающей `---`).


def strip_frontmatter(text: str) -> str:
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4 :]
    return text


def normalize_words(text: str) -> List[str]:
    """Нормализованный поток слов: lower, ё→е, пунктуация выброшена."""
    return WORD_RE.findall(strip_frontmatter(text).lower().replace("ё", "е"))


def anchor_index(words: Sequence[str], anchor_len: int = ANCHOR_LEN) -> Dict[Tuple[str, ...], List[int]]:
    idx: Dict[Tuple[str, ...], List[int]] = defaultdict(list)
    for i in range(len(words) - anchor_len + 1):
        idx[tuple(words[i : i + anchor_len])].append(i)
    return idx


def longest_common_run(
    content: Sequence[str],
    source: Sequence[str],
    source_idx: Dict[Tuple[str, ...], List[int]],
    anchor_len: int = ANCHOR_LEN,
) -> Tuple[int, Tuple[int, int]]:
    """Максимальный подряд-идущий общий ран (жадное продление от якорей).

    Возвращает (длина, (начало, конец) в словах КОНТЕНТ-файла).
    """
    best = 0
    best_span = (0, 0)
    n = len(content)
    for i in range(n - anchor_len + 1):
        hits = source_idx.get(tuple(content[i : i + anchor_len]))
        if not hits:
            continue
        for j in hits:
            # продление вправо
            r = anchor_len
            while i + r < n and j + r < len(source) and content[i + r] == source[j + r]:
                r += 1
            # продление влево
            l = 0
            while i - l - 1 >= 0 and j - l - 1 >= 0 and content[i - l - 1] == source[j - l - 1]:
                l += 1
            run = l + r
            if run > best:
                best = run
                best_span = (i - l, i - l + run)
    return best, best_span


def expand_globs(patterns: Sequence[str]) -> List[Path]:
    """Разворачивает список glob-паттернов (включая {a,b} — вручную, для
    переносимости) в сортированный список файлов."""
    files: set = set()
    for pattern in patterns:
        expanded = brace_expand(pattern)
        for p in expanded:
            files.update(Path(m) for m in globmod.glob(p, recursive=True))
    result = sorted(f for f in files if f.is_file())
    return result


def brace_expand(pattern: str) -> List[str]:
    """Минимальное расширение `{a,b,c}` на одном уровне (вложенность не нужна)."""
    m = re.search(r"\{([^{}]*)\}", pattern)
    if not m:
        return [pattern]
    head, tail = pattern[: m.start()], pattern[m.end() :]
    return [head + variant + tail for variant in m.group(1).split(",")]


def load_words(path: Path) -> List[str]:
    return normalize_words(path.read_text(encoding="utf-8", errors="replace"))


def check_pairwise(content_files: List[Path], threshold: int) -> List[dict]:
    """Self-check: каждая пара опубликованных файлов — раны >= порога недопустимы."""
    violations: List[dict] = []
    words = {f: load_words(f) for f in content_files}
    indexes = {f: anchor_index(words[f]) for f in content_files}
    for i, a in enumerate(content_files):
        for b in content_files[i + 1 :]:
            run, span = longest_common_run(words[a], words[b], indexes[b])
            if run >= threshold:
                violations.append(
                    {
                        "content": str(a),
                        "source": str(b),
                        "run": run,
                        "words": " ".join(words[a][span[0] : span[1]][: run + 6]),
                    }
                )
    return violations


def check_against_sources(content_files: List[Path], source_files: List[Path], threshold: int) -> List[dict]:
    violations: List[dict] = []
    src_words = {f: load_words(f) for f in source_files}
    src_idx = {f: anchor_index(src_words[f]) for f in source_files}
    for c in content_files:
        c_words = load_words(c)
        for s in source_files:
            run, span = longest_common_run(c_words, src_words[s], src_idx[s])
            if run >= threshold:
                violations.append(
                    {
                        "content": str(c),
                        "source": str(s),
                        "run": run,
                        "words": " ".join(c_words[span[0] : span[1]][: run + 6]),
                    }
                )
    return violations


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--content", nargs="+", default=None, help="glob(ы) контент-файлов (проверяемых)")
    parser.add_argument("--sources", nargs="+", default=None, help="glob(ы) файлов-первоисточников")
    parser.add_argument(
        "--self-check",
        action="store_true",
        help="крест-накрест проверить контент против самого себя (внутренние копипасты)",
    )
    parser.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD, help=f"максимально допустимый ран (default {DEFAULT_THRESHOLD})")
    parser.add_argument("--json", action="store_true", help="машинный отчёт вместо текстового")
    args = parser.parse_args(argv)

    default_content = ["src/content/{history,campaigns,world}/**/*.md"]

    violations: List[dict] = []
    if args.self_check:
        content = expand_globs(args.content or default_content)
        if len(content) < 2:
            print("self-check: нужно минимум 2 контент-файла", file=sys.stderr)
            return 2
        violations += check_pairwise(content, args.threshold)
    if args.sources:
        content = expand_globs(args.content or default_content)
        sources = expand_globs(args.sources)
        if not content or not sources:
            print("пустой набор файлов (content/sources)", file=sys.stderr)
            return 2
        violations += check_against_sources(content, sources, args.threshold)
    if not args.self_check and not args.sources:
        parser.error("нужен --self-check и/или --sources (см. --help)")

    if args.json:
        print(json.dumps({"violations": violations, "threshold": args.threshold}, ensure_ascii=False, indent=2))
    else:
        if violations:
            for v in violations:
                print(f"КОПИПАСТА: ран {v['run']} слов (порог {args.threshold})")
                print(f"  контент: {v['content']}")
                print(f"  источник: {v['source']}")
                print(f"  совпало: «{v['words']}»")
                print()
        status = "FAIL" if violations else "OK"
        print(f"Анти-копипаст-чекер: {status} — нарушений {len(violations)} (норма ≤ {args.threshold - 1} слов подряд)")
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
