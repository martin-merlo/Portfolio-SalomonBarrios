import type { Obra } from '@/lib/tipos';
import SectionLabel from './SectionLabel';
import ObraCard from './ObraCard';

export default function Work({ obras }: { obras: Obra[] }) {
  return (
    <section id="work" className="px-5 sm:px-10 lg:px-14 pb-20 sm:pb-28">
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
