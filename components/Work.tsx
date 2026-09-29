import type { Obra } from '@/lib/tipos';
import { MARGEN_PAPEL } from '@/lib/estilos';
import SectionLabel from './SectionLabel';
import ObraCard from './ObraCard';

export default function Work({ obras }: { obras: Obra[] }) {
  return (
    <section id="work" className={`${MARGEN_PAPEL} pb-20 sm:pb-28`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto="work.2" />
        <div className="grid grid-cols-12 gap-2 sm:gap-3" style={{ gridAutoFlow: 'dense' }}>
          {obras.map((obra) => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>
      </div>
    </section>
  );
}
