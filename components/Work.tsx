import { textos, type Idioma } from '@/lib/i18n';
import type { Obra } from '@/lib/tipos';
import { MARGEN_PAPEL } from '@/lib/estilos';
import SectionLabel from './SectionLabel';
import ObraCard from './ObraCard';

export default function Work({ obras, idioma }: { obras: Obra[]; idioma: Idioma }) {
  return (
    <section id="work" className={`${MARGEN_PAPEL} scroll-mt-16 sm:scroll-mt-[72px] pb-20 sm:pb-28`}>
      <div className="max-w-[1500px] mx-auto">
        <SectionLabel texto={textos(idioma).labels.work} />
        <div className="grid grid-cols-12 gap-2 sm:gap-3" style={{ gridAutoFlow: 'dense' }}>
          {obras.map((obra) => (
            <ObraCard key={obra.id} obra={obra} idioma={idioma} />
          ))}
        </div>
      </div>
    </section>
  );
}
