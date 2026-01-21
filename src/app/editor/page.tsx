'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ArmlistEditor from '@/components/ArmlistEditor';
import { Squad, Machine } from '@/lib/types';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';

export default function EditorPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editMode, setEditMode] = useState<'squad' | 'machine'>('squad');
  const [editingSquad, setEditingSquad] = useState<Squad | undefined>();
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [squadsRes, machinesRes] = await Promise.all([
        fetch('/api/armlists/squads'),
        fetch('/api/armlists/machines')
      ]);

      if (squadsRes.ok) {
        const squadsData = await squadsRes.json();
        setSquads(squadsData);
      }

      if (machinesRes.ok) {
        const machinesData = await machinesRes.json();
        setMachines(machinesData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = (type: 'squad' | 'machine') => {
    setEditMode(type);
    setEditingSquad(undefined);
    setEditingMachine(undefined);
    setMode('edit');
  };

  const handleEdit = (squad?: Squad, machine?: Machine) => {
    if (squad) {
      setEditMode('squad');
      setEditingSquad(squad);
      setEditingMachine(undefined);
    } else if (machine) {
      setEditMode('machine');
      setEditingMachine(machine);
      setEditingSquad(undefined);
    }
    setMode('edit');
  };

  const handleDelete = async (id: string, type: 'squad' | 'machine') => {
    if (!confirm('Вы уверены, что хотите удалить этот армлист?')) {
      return;
    }

    try {
      const endpoint = type === 'squad' ? '/api/armlists/squads' : '/api/armlists/machines';
      const response = await fetch(`${endpoint}?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadData();
      } else {
        alert('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка удаления');
    }
  };

  const handleSave = () => {
    loadData();
    setMode('list');
    setEditingSquad(undefined);
    setEditingMachine(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Загрузка...</div>
      </div>
    );
  }

  if (mode === 'edit') {
    return (
      <div className="min-h-screen bg-slate-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => {
              setMode('list');
              setEditingSquad(undefined);
              setEditingMachine(undefined);
            }}
            className="mb-4 flex items-center gap-2 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </button>
          <ArmlistEditor
            mode={editMode}
            initialSquad={editingSquad}
            initialMachine={editingMachine}
            onSave={handleSave}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Редактор армлистов</h1>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => handleNew('squad')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новый взвод
          </button>
          <button
            onClick={() => handleNew('machine')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Новая техника
          </button>
        </div>

        {/* Squads list */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Взводы ({squads.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {squads.map((squad) => (
              <div
                key={squad.id}
                className="bg-slate-800 p-4 rounded-lg border border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{squad.name}</h3>
                    <p className="text-sm text-slate-400">{squad.faction}</p>
                    <p className="text-sm text-slate-400">{squad.cost} очков</p>
                  </div>
                </div>
                {squad.image && (
                  <Image
                    src={squad.image}
                    alt={squad.name}
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(squad)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(squad.id, 'squad')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {squads.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-8">
                Нет взводов. Создайте новый!
              </div>
            )}
          </div>
        </div>

        {/* Machines list */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Техника ({machines.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="bg-slate-800 p-4 rounded-lg border border-slate-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{machine.name}</h3>
                    <p className="text-sm text-slate-400">{machine.faction}</p>
                    <p className="text-sm text-slate-400">{machine.cost} очков</p>
                  </div>
                </div>
                {machine.image && (
                  <Image
                    src={machine.image}
                    alt={machine.name}
                    width={300}
                    height={128}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(undefined, machine)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(machine.id, 'machine')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded text-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {machines.length === 0 && (
              <div className="col-span-full text-center text-slate-400 py-8">
                Нет техники. Создайте новую!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


