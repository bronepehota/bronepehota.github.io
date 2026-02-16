import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Отряд не найден</h1>
        <p className="text-slate-400 mb-8">Такого отряда не существует в энциклопедии</p>
        <Link
          href="/encyclopedia"
          className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          Вернуться к энциклопедии
        </Link>
      </div>
    </div>
  );
}
