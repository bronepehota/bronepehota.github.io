import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Machine } from '@/lib/types';

const MACHINES_FILE = join(process.cwd(), 'src', 'data', 'machines.json');

function readMachines(): Machine[] {
  try {
    const data = readFileSync(MACHINES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeMachines(machines: Machine[]) {
  writeFileSync(MACHINES_FILE, JSON.stringify(machines, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const machines = readMachines();
    return NextResponse.json(machines);
  } catch {
    return NextResponse.json(
      { error: 'Ошибка чтения данных' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const machine: Machine = await request.json();

    // Валидация
    if (!machine.id || !machine.name || !machine.faction) {
      return NextResponse.json(
        { error: 'Не заполнены обязательные поля' },
        { status: 400 }
      );
    }

    const machines = readMachines();
    const existingIndex = machines.findIndex(m => m.id === machine.id);

    if (existingIndex >= 0) {
      // Обновляем существующий
      machines[existingIndex] = machine;
    } else {
      // Добавляем новый
      machines.push(machine);
    }

    writeMachines(machines);

    return NextResponse.json({ success: true, machine });
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

    const machines = readMachines();
    const filtered = machines.filter(m => m.id !== id);
    
    if (filtered.length === machines.length) {
      return NextResponse.json(
        { error: 'Техника не найдена' },
        { status: 404 }
      );
    }

    writeMachines(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Ошибка удаления' },
      { status: 500 }
    );
  }
}


