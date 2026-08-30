#!/usr/bin/env python3
"""Анти-регресс контрастности текста (WCAG AA) для публичных поверхностей.

Паттерн того же класса, что tools/check_copy_paste.py: дешёвый статический
гард, ловящий возвращение тусклых text-классов. Проверяет только ИНФОРМАЦИОННЫЙ
текст (text-* / placeholder:text-*) в энциклопедии и на лендинге против худшего
композитного фона карточек; бордеры/фоны не трогает.

Логика: цвет+прозрачность из tailwind.config.ts композитится на три фона
(страница #0C0A09, карточка charcoal/70, карточка charcoal/60), считается
WCAG-отношение; информационный текст обязан давать ≥ 4.5.

Документированные исключения (выводит в отчёт, не падает):
- text-military-dark — тёмный текст на янтарных/ржавых ЗАЛИВКАХ (обратный
  контраст: 12.3+ на amber), наш фон-худший-случай к нему неприменим;
- text-military-red/50 — мигающий декоративный ⚠ в HUD-макете лендинга
  (aria-декорация сцены, не информация).

Выход: 0 — норма; 1 — найден тусклый информационный текст (печать списка).
"""
from __future__ import annotations

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SURFACES = [
    'src/components/encyclopedia',
    'src/app/encyclopedia',
    'src/components/landing',
]
# Худшие фоны под светлый текст (композиты карточек + страница)
BACKGROUNDS = ['#0C0A09', '#171413', '#161311']
MIN_AA = 4.5
ALLOWED_EXCEPTIONS = {
    'text-military-dark': 'тёмный текст на янтарных/ржавых заливках (обратный контраст)',
    'text-military-red/50': 'декоративный ⚠ в HUD-макете лендинга',
}


def _lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _lum(hexc: str) -> float:
    h = hexc.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def _ratio(a: str, b: str) -> float:
    l1, l2 = sorted((_lum(a), _lum(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)


def _composite(fg: str, bg: str, alpha: float) -> str:
    f = tuple(int(fg.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    b = tuple(int(bg.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    return '#%02x%02x%02x' % tuple(round(alpha * x + (1 - alpha) * y) for x, y in zip(f, b))


def load_tokens() -> dict[str, str]:
    cfg = open(os.path.join(ROOT, 'tailwind.config.ts')).read()
    return dict(re.findall(r"'(military-[a-z]+|hud-green|hud-amber)':\s*'(#[0-9A-Fa-f]{6})'", cfg)) | {'white': '#FFFFFF'}


def main() -> int:
    tokens = load_tokens()
    text_pat = re.compile(r'(?<![-\w])(?:placeholder:)?text-([a-z][\w-]*)(/(\d+))?')
    offenders: dict[str, tuple[float, str]] = {}

    for surface in SURFACES:
        for dirpath, _, files in os.walk(os.path.join(ROOT, surface)):
            for fname in files:
                if not fname.endswith(('.tsx', '.ts')):
                    continue
                text = open(os.path.join(dirpath, fname)).read()
                rel = os.path.relpath(os.path.join(dirpath, fname), ROOT)
                for m in text_pat.finditer(text):
                    cls = f'text-{m.group(1)}' + (f'/{m.group(3)}' if m.group(3) else '')
                    if cls in ALLOWED_EXCEPTIONS or m.group(1) not in tokens:
                        continue
                    alpha = int(m.group(3)) / 100 if m.group(3) else 1.0
                    worst = min(
                        _ratio(_composite(tokens[m.group(1)], bg, alpha), bg)
                        for bg in BACKGROUNDS
                    )
                    if worst < MIN_AA:
                        offenders.setdefault(cls, (worst, rel))

    if offenders:
        print('Контраст-чекер: тусклый информационный текст (норма ≥ 4.5):')
        for cls, (worst, rel) in sorted(offenders.items(), key=lambda x: x[1][0]):
            print(f'  ✗ {cls:28} {worst:.2f}  (пример: {rel})')
        print('\nЗамены-паттерн: steel/*→taupe/80, rust/*→solid rust, taupe/50-70→taupe/80,')
        print('sand/40-50→sand/60, amber/30-60→amber/70 — см. tools/check_contrast.py.')
        return 1
    print(f'Контраст-чекер: OK — информационный текст ≥ {MIN_AA}:1 на всех поверхностях')
    for cls, why in ALLOWED_EXCEPTIONS.items():
        print(f'  doc-исключение: {cls} — {why}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
