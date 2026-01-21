import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Faction } from '@/lib/types';

const FACTIONS_FILE = join(process.cwd(), 'src', 'data', 'factions.json');

function readFactions(): Faction[] {
  try {
    const data = readFileSync(FACTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeFactions(factions: Faction[]) {
  writeFileSync(FACTIONS_FILE, JSON.stringify(factions, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const factions = readFactions();
    return NextResponse.json(factions);
  } catch {
    return NextResponse.json(
      { error: 'Ошибка чтения данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const faction: Faction = await request.json();

    // Валидация
    if (!faction.id || !faction.name || !faction.color) {
      return NextResponse.json(
        { error: 'Не заполнены обязательные поля' },
        { status: 400 }
      );
    }

    const factions = readFactions();
    const existingIndex = factions.findIndex(f => f.id === faction.id);

    if (existingIndex >= 0) {
      // Обновляем существующий
      factions[existingIndex] = faction;
    } else {
      // Добавляем новый
      factions.push(faction);
    }

    writeFactions(factions);

    return NextResponse.json({ success: true, faction });
  } catch {
    return NextResponse.json(
      { error: 'Ошибка сохранения данных' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Не указан ID' },
        { status: 400 }
      );
    }

    const factions = readFactions();
    const filtered = factions.filter(f => f.id !== id);
    
    if (filtered.length === factions.length) {
      return NextResponse.json(
        { error: 'Фракция не найдена' },
        { status: 404 }
      );
    }

    writeFactions(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Ошибка удаления' },
      { status: 500 }
    );
  }
}


