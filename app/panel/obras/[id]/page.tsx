import { notFound } from 'next/navigation';
import { getObraConImagenesPorId } from '@/lib/panel/datos';
import ObraForm from '@/components/panel/ObraForm';

export default async function EditarObraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const obra = await getObraConImagenesPorId(id);

  if (!obra) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Editar obra</h1>
      <ObraForm modo="editar" obraInicial={obra} />
    </div>
  );
}
