import type { Metadata } from 'next';
import { cousine, sekuya } from '@/lib/fonts';
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
      </body>
    </html>
  );
}
