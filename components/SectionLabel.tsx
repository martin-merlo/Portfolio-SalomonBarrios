export default function SectionLabel({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-3 font-subtitulo text-tinta text-lg sm:text-xl mb-8 sm:mb-10">
      <span>{texto}</span>
      <span
        aria-hidden="true"
        className="flex-1 border-t-2 border-dotted border-tinta/40 translate-y-[3px]"
      />
      <span aria-hidden="true">~</span>
    </div>
  );
}
