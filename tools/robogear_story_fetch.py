#!/usr/bin/env python3
"""Скачивает рассказ игрока с robogear.ru (cp1251), чистит вёрстку 2008 года,
выводит markdown-черновик в stdout. После скрипта — ручная вычитка
(диалоги, переносы, мусор навигации).

Usage: python3 tools/robogear_story_fetch.py URL > /tmp/story.md
"""
import html
import re
import sys
import urllib.request

FOOTER_MARK = 'Все права принадлежат'


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (bronepehota lore-import)'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('cp1251', errors='replace')


def extract_body(h: str) -> str:
    # Тело рассказа живёт в контентной таблице; подвал с копирайтом — граница конца.
    # В живой вёрстке robogear.ru атрибут отделён двойным пробелом:
    # '<table  cellspacing="10"' — поэтому regex с \s+, последняя подходящая таблица.
    starts = [m.start() for m in re.finditer(r'<table\s+cellspacing="10"', h)]
    start = starts[-1] if starts else -1
    end = h.find(FOOTER_MARK)
    if start == -1 or end == -1 or end < start:
        raise SystemExit('не найдены границы тела рассказа')
    return h[start:end]


def to_markdown(fragment: str) -> str:
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', fragment, flags=re.S | re.I)
    s = re.sub(r'<img[^>]*>', ' ', s, flags=re.I)              # иллюстрации не переносим
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</p>', '\n\n', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()


if __name__ == '__main__':
    print(to_markdown(extract_body(fetch(sys.argv[1]))))
