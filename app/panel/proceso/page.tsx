import { getProceso } from '@/lib/datos';
import ProcesoLista from '@/components/panel/ProcesoLista';

export default async function ProcesoPanelPage() {
  const items = await getProceso();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Proceso</h1>
      <ProcesoLista itemsIniciales={items} />
    </div>
  );
}
