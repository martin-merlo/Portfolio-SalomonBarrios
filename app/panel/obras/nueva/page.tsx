import ObraForm from '@/components/panel/ObraForm';

export default function NuevaObraPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-6">Nueva obra</h1>
      <ObraForm modo="crear" />
    </div>
  );
}
