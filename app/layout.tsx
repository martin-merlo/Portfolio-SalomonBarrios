import type { Metadata } from 'next';
import { cousine, sekuya } from '@/lib/fonts';
import EfectosVisuales from '@/components/EfectosVisuales';
import CursorCustom from '@/components/CursorCustom';
import ProtegerObras from '@/components/ProtegerObras';
import { getIdioma } from '@/lib/idioma';
import { textos } from '@/lib/i18n';
import './globals.css';

// Título/descripción por defecto en el idioma del visitante (las páginas de
// obra los reemplazan por los de la obra).
export async function generateMetadata(): Promise<Metadata> {
  const tx = textos(await getIdioma());
  return { title: tx.metaTitulo, description: tx.metaDescripcion };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const idioma = await getIdioma();
  return (
    <html lang={idioma}>
      <body className={`${sekuya.variable} ${cousine.variable} bg-papel text-tinta antialiased`}>
        {children}
        {/* Cursor y efectos se autodescartan en /panel y en dispositivos sin
            mouse real; cada efecto tiene su interruptor en lib/efectos.ts.
            Comparten el mismo origen del mouse: lib/raton.ts. */}
        {/* Frena la descarga casual de las obras (clic derecho, arrastrar). */}
        <ProtegerObras />
        <CursorCustom />
        <EfectosVisuales />
      </body>
    </html>
  );
}
