'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ITEMS = [
  { label: 'Obras', href: '/panel/obras' },
  { label: 'Contenido del sitio', href: '/panel/contenido' },
  { label: 'Proceso', href: '/panel/proceso' },
];

export default function PanelNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function cerrarSesion() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/panel/login');
    router.refresh();
  }

  return (
    <nav className="sm:w-56 shrink-0 bg-slate-900 text-slate-100 flex flex-col">
      <div className="p-4 font-semibold border-b border-slate-700">Panel</div>
      <ul className="flex-1 flex sm:flex-col">
        {ITEMS.map((item) => {
          const activo = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1 sm:flex-none">
              <Link
                href={item.href}
                className={`block px-4 py-3 text-sm transition-colors ${
                  activo ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="p-4 border-t border-slate-700">
        <button
          type="button"
          onClick={cerrarSesion}
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
