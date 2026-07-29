'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Obra } from '@/lib/tipos';
import SectionLabel from './SectionLabel';
import ObraCard from './ObraCard';
import Visor from './Visor';

export default function Work({ obras }: { obras: Obra[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const obraId = searchParams.get('obra');
  const indice = obraId ? obras.findIndex((o) => o.id === obraId) : -1;
  const obraAbierta = indice >= 0 ? obras[indice] : null;

  function abrir(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('obra', id);
    router.push(`${pathname}?${params.toString()}#work`, { scroll: false });
  }

  function cerrar() {
    router.replace(pathname, { scroll: false });
  }

  function navegar(delta: number) {
    if (indice === -1) return;
    const siguiente = obras[(indice + delta + obras.length) % obras.length];
    const params = new URLSearchParams(searchParams.toString());
    params.set('obra', siguiente.id);
    router.replace(`${pathname}?${params.toString()}#work`, { scroll: false });
  }

  return (
    <section id="work" className="px-5 sm:px-10 lg:px-14 pb-20 sm:pb-28">
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="work.2" />
        <div className="grid grid-cols-12 gap-2 sm:gap-3" style={{ gridAutoFlow: 'dense' }}>
          {obras.map((obra) => (
            <ObraCard key={obra.id} obra={obra} onAbrir={() => abrir(obra.id)} />
          ))}
        </div>
      </div>

      {obraAbierta && (
        <Visor
          obra={obraAbierta}
          indice={indice}
          total={obras.length}
          onCerrar={cerrar}
          onPrev={() => navegar(-1)}
          onNext={() => navegar(1)}
        />
      )}
    </section>
  );
}
