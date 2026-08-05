import Link from 'next/link';
import { getTodasLasObras } from '@/lib/panel/datos';
import ObrasLista from '@/components/panel/ObrasLista';

export default async function ObrasPanelPage() {
  const obras = await getTodasLasObras();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Obras</h1>
        <Link
          href="/panel/obras/nueva"
          className="rounded bg-slate-800 text-white text-sm font-medium px-4 py-2 hover:bg-slate-700 transition-colors"
        >
          + Nueva obra
        </Link>
      </div>

      <ObrasLista obrasIniciales={obras} />
    </div>
  );
}
