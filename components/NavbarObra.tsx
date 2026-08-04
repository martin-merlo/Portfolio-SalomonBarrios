import Link from 'next/link';

const ITEMS = [
  { label: 'BIO', href: '/#bio' },
  { label: 'CAV', href: '/#cav' },
  { label: 'WORK', href: '/#work' },
];

/**
 * Navbar de las páginas /obra/[slug]. A diferencia del Navbar del home, acá
 * el nombre del artista es chico y fijo siempre — sin la animación de
 * anclado, que es exclusiva del home (acá el protagonista del hero es el
 * título de la obra). Funciona como link a "/". Los otros tres items no
 * apuntan a secciones de esta página (no existen acá) sino de vuelta al home.
 */
export default function NavbarObra({ nombreArtista }: { nombreArtista: string }) {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 h-16 sm:h-[72px] flex items-center justify-between gap-2 px-3 sm:px-8 lg:px-12 bg-navbar">
      <Link
        href="/"
        className="font-display uppercase text-claro leading-none whitespace-nowrap shrink-0 text-base sm:text-lg hover:opacity-80 transition-opacity"
      >
        {nombreArtista}
      </Link>
      <ul className="flex gap-2 sm:gap-7 font-mono font-bold uppercase text-[0.55rem] sm:text-sm tracking-wide text-claro shrink-0">
        {ITEMS.map((item) => (
          <li key={item.label}>
            <a href={item.href} className="hover:opacity-70 transition-opacity">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
