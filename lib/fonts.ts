import localFont from 'next/font/local';
import { Cousine } from 'next/font/google';

/**
 * Display — título grande "SALOMÓN BARRIOS" en el hero. Un solo peso, mayúsculas.
 * Sekuya no está en el registro de next/font/google que trae esta versión de
 * Next (arroja "Unknown font `Sekuya`" en build), así que se self-hostea el
 * archivo real vía next/font/local — ver public/fonts/README.md. Verificado:
 * el glifo Ó (Oacute) SÍ está presente en el cmap de la fuente.
 */
export const sekuya = localFont({
  src: '../public/fonts/Sekuya.woff2',
  weight: '400',
  variable: '--font-display-raw',
  display: 'swap',
});

/**
 * Mono — reemplaza Courier New (no se puede embeber por licencia). Ítems del navbar,
 * subtítulo del hero, encabezado "DECLARACIÓN DEL ARTISTA", títulos sobre las obras.
 */
export const cousine = Cousine({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cousine-raw',
  display: 'swap',
});
