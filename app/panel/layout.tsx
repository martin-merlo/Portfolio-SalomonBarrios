import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import PanelNav from '@/components/panel/PanelNav';

// Todo el segmento /panel (incluido /panel/login) queda fuera de buscadores.
// Nunca en robots.txt — esto es lo correcto: noindex por metadata, no una
// entrada en robots.txt que además anunciaría públicamente que la ruta existe.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión sólo se puede estar viendo /panel/login (el middleware
  // redirige cualquier otra ruta bajo /panel hacia ahí) — layout mínimo, sin
  // la navegación de las secciones internas.
  if (!user) {
    return <div className="min-h-screen bg-slate-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col sm:flex-row">
      <PanelNav />
      <main className="flex-1 min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
