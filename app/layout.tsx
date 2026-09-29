import type { Metadata } from 'next';
import { cousine, sekuya } from '@/lib/fonts';
import AberracionCromatica from '@/components/AberracionCromatica';
import CursorCustom from '@/components/CursorCustom';
import './globals.css';

export const metadata: Metadata = {
  title: 'Salomón Barrios — Artista Digital, pintor',
  description: 'Portfolio de Salomón Barrios, artista digital y pintor.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${sekuya.variable} ${cousine.variable} bg-papel text-tinta antialiased`}>
        {children}
        {/* Los dos se autodescartan en /panel y en dispositivos sin mouse real
            (la aberración también con prefers-reduced-motion). Comparten el
            mismo origen del mouse: lib/raton.ts. */}
        <CursorCustom />
        <AberracionCromatica />
      </body>
    </html>
  );
}
