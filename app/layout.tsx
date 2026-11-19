import type { Metadata } from 'next';
import { cousine, sekuya } from '@/lib/fonts';
import EfectosVisuales from '@/components/EfectosVisuales';
import CursorCustom from '@/components/CursorCustom';
import ProtegerObras from '@/components/ProtegerObras';
import PantallaCarga from '@/components/PantallaCarga';
import { CLAVE_CARGA } from '@/lib/pantallaCarga';
import { getIdioma } from '@/lib/idioma';
import { textos } from '@/lib/i18n';
import './globals.css';

// Script del <head> de la pantalla de carga (ver el comentario en el JSX).
const TECLAS_SCROLL = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
const SCRIPT_CARGA = `try{var h=document.documentElement;if(location.pathname.indexOf('/panel')!==0){if(sessionStorage.getItem('${CLAVE_CARGA}'))h.setAttribute('data-cargado','');else{var o={passive:false},n=function(e){e.preventDefault()},k=function(e){if(${JSON.stringify(TECLAS_SCROLL)}.indexOf(e.key)>-1)e.preventDefault()},s=function(){if(scrollY)scrollTo(0,0)};addEventListener('wheel',n,o);addEventListener('touchmove',n,o);addEventListener('keydown',k);addEventListener('scroll',s);window.__liberarCarga=function(){removeEventListener('wheel',n,o);removeEventListener('touchmove',n,o);removeEventListener('keydown',k);removeEventListener('scroll',s);window.__liberarCarga=null};setTimeout(function(){window.__liberarCarga&&window.__liberarCarga()},12000)}}}catch(e){}`;

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
    // suppressHydrationWarning: el script del <head> le agrega data-cargado al
    // <html> antes de que React hidrate.
    <html lang={idioma} suppressHydrationWarning>
      <head>
        {/* Pantalla de carga (ver PantallaCarga), antes del primer pintado: si
            ya se vio en esta sesión se oculta sin parpadeo; si no, bloquea el
            scroll desde ya (si esperara a React, en una red lenta se podía
            scrollear 1-2s). Bloquea frenando rueda, arrastre táctil y teclas, NO
            con overflow:hidden: eso sacaba la barra de scroll y al terminar el
            sitio entero se corría 15px. PantallaCarga llama a __liberarCarga al
            terminar; si el JavaScript del sitio fallara, se libera solo a los
            12s, cuando la pantalla también se va sola. Fuera del panel. Sin
            JavaScript no aparece nunca. */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_CARGA }} />
        <noscript>
          <style>{'#pantalla-carga{display:none}'}</style>
        </noscript>
      </head>
      <body className={`${sekuya.variable} ${cousine.variable} bg-papel text-tinta antialiased`}>
        <PantallaCarga idioma={idioma} />
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
