import { getContenidoCompleto } from '@/lib/datos';
import ContenidoForm from '@/components/panel/ContenidoForm';

export default async function ContenidoPanelPage() {
  const { es, en } = await getContenidoCompleto();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Contenido del sitio</h1>
      <ContenidoForm contenidoInicial={es} enInicial={en} />
    </div>
  );
}
