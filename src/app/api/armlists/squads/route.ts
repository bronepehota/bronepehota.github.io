import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Squad } from '@/lib/types';

const SQUADS_FILE = join(process.cwd(), 'src', 'data', 'squads.json');

function readSquads(): Squad[] {
  try {
    const data = readFileSync(SQUADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeSquads(squads: Squad[]) {
  writeFileSync(SQUADS_FILE, JSON.stringify(squads, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const squads = readSquads();
    return NextResponse.json(squads);
  } catch {
    return NextResponse.json(
      { error: 'Ошибка чтения данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const squad: Squad = await request.json();

    // Валидация
    if (!squad.id || !squad.name || !squad.faction || !squad.soldiers || squad.soldiers.length === 0) {
      return NextResponse.json(
        { error: 'Не заполнены обязательные поля' },
        { status: 400 }
      );
    }

    const squads = readSquads();
    const existingIndex = squads.findIndex(s => s.id === squad.id);

    if (existingIndex >= 0) {
      // Обновляем существующий
      squads[existingIndex] = squad;
    } else {
      // Добавляем новый
      squads.push(squad);
    }

    writeSquads(squads);

    return NextResponse.json({ success: true, squad });
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

    const squads = readSquads();
    const filtered = squads.filter(s => s.id !== id);
    
    if (filtered.length === squads.length) {
      return NextResponse.json(
        { error: 'Взвод не найден' },
        { status: 404 }
      );
    }

    writeSquads(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Ошибка удаления' },
      { status: 500 }
    );
  }
}


