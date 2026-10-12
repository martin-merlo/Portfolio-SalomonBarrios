'use client';

import { useEffect, useRef } from 'react';
import { suscribirRaton } from '@/lib/raton';

/**
 * Aberración cromática difuminada (CSS/SVG, sin WebGL), siempre presente y sutil,
 * que el CURSOR LIMPIA a su alrededor: se ve menos cerca del puntero y más lejos.
 * La monta EfectosVisuales (flag `aberracionActiva`, ver lib/efectos.ts), que ya
 * filtra panel/touch/reduced-motion.
 *
 * Imágenes de obra (`data-aberracion="imagen"`):
 *   - Encima de cada imagen se pone una COPIA ("capa") con un filtro SVG FIJO:
 *     canales rojo y cian desplazados y difuminados, sumados a la imagen nítida
 *     como franjas de color suaves (no la reemplazan, no la desenfocan).
 *   - La capa lleva un mask-image radial centrado en el cursor: transparente
 *     cerca del puntero (ahí se ve la imagen limpia) y opaca lejos. La zona
 *     limpia sigue al mouse DENTRO de cada imagen.
 *   - El filtro no cambia nunca. Por frame sólo se escriben dos variables CSS
 *     (posición del cursor relativa a cada capa), sólo en las capas a menos de
 *     R_PLENO del cursor y sólo si cambiaron. Máscara y filtro van en
 *     elementos distintos (ver crearCapa) para que mover la máscara no vuelva
 *     a correr el filtro.
 *
 * Títulos grandes (`data-aberracion="texto"`): text-shadow rojo/cian con blur,
 * cuya intensidad baja cuando el cursor se acerca al título (ver globals.css).
 *
 * Nunca sobre texto de lectura: sólo lo marcado explícitamente.
 *
 * Mouse: no hay listener propio; se suscribe al store compartido lib/raton.ts
 * (el mismo del cursor custom), que además se despierta con el scroll. Con el
 * mouse y la página quietos no corre nada. Contenido dinámico (obras/bloques
 * que llegan de Supabase) se detecta con un MutationObserver.
 */

// Filtro (px CSS): desplazamiento de cada canal, blur de las franjas y cuánto
// se suman a la imagen.
// Elegidos a ojo sobre render real: con 2.4px / 0.85 se notaba en todos los
// contornos (más que "muy sutil"); así queda como halo suave.
const DESPLAZAMIENTO = 2;
const BLUR = 1.3;
const FUERZA = 0.6;
// Zona limpia alrededor del cursor (px): 0 hasta R_LIMPIO, plena desde R_PLENO.
const R_LIMPIO = 40;
const R_PLENO = 230;
// Títulos: separación máxima (px) y distancia (px) a la que llega a plena.
const TEXTO_MAX = 1.8;
const TEXTO_PLENO = 420;

const ID_FILTRO = 'aberracion-difusa';
// Tres máscaras intersectadas: la zona limpia alrededor del cursor, y un
// desvanecido de 8px en los cantos de la copia — sin eso, al desplazar los
// canales, en el borde de la caja quedaba una línea cian/roja dura.
const BORDE = 8;
const MASCARA = [
  `radial-gradient(circle at var(--ab-mx, -9999px) var(--ab-my, -9999px), transparent ${R_LIMPIO}px, #000 ${R_PLENO}px)`,
  `linear-gradient(to right, transparent, #000 ${BORDE}px, #000 calc(100% - ${BORDE}px), transparent)`,
  `linear-gradient(to bottom, transparent, #000 ${BORDE}px, #000 calc(100% - ${BORDE}px), transparent)`,
].join(', ');
const SVGNS = 'http://www.w3.org/2000/svg';
const FUERA = -10000; // cursor fuera de la ventana: aberración plena en todos lados

interface Capa {
  objetivo: HTMLElement;
  capa: HTMLElement;
  visible: boolean;
  ax: number;
  ay: number;
}

interface Titulo {
  el: HTMLElement;
  visible: boolean;
  intensidad: number;
}

function suave(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

/** Filtro fijo: imagen nítida + franjas rojo/cian difuminadas (sólo la diferencia). */
function crearFiltro(defs: SVGDefsElement) {
  const f = document.createElementNS(SVGNS, 'filter');
  f.setAttribute('id', ID_FILTRO);
  f.setAttribute('color-interpolation-filters', 'sRGB');
  f.setAttribute('x', '-4%');
  f.setAttribute('y', '-4%');
  f.setAttribute('width', '108%');
  f.setAttribute('height', '108%');
  const el = (tag: string, attrs: Record<string, string>) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    f.appendChild(n);
  };
  const d = String(DESPLAZAMIENTO);
  const b = String(BLUR);
  // Canal rojo desplazado a la derecha + blur.
  el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', result: 'r' });
  el('feOffset', { in: 'r', dx: d, dy: '0', result: 'r2' });
  el('feGaussianBlur', { in: 'r2', stdDeviation: b, result: 'r3' });
  // Verde + azul (cian) a la izquierda + blur.
  el('feColorMatrix', { in: 'SourceGraphic', type: 'matrix', values: '0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0', result: 'c' });
  el('feOffset', { in: 'c', dx: `-${d}`, dy: '0', result: 'c2' });
  el('feGaussianBlur', { in: 'c2', stdDeviation: b, result: 'c3' });
  // Versión separada (difusa) y la misma imagen sólo difuminada.
  el('feBlend', { in: 'r3', in2: 'c3', mode: 'screen', result: 'separada' });
  el('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: b, result: 'difusa' });
  // diferencia = separada − difusa (+0.5 para no recortar negativos): son SÓLO
  // las franjas de color, sin el contenido.
  el('feComposite', { in: 'separada', in2: 'difusa', operator: 'arithmetic', k1: '0', k2: '1', k3: '-1', k4: '0.5', result: 'franjas' });
  // final = original + FUERZA·(franjas − 0.5): la imagen sigue nítida.
  const k = String(FUERZA);
  el('feComposite', { in: 'SourceGraphic', in2: 'franjas', operator: 'arithmetic', k1: '0', k2: '1', k3: k, k4: String(-0.5 * FUERZA) });
  defs.appendChild(f);
}

/**
 * Capa encima de la imagen: un CONTENEDOR con la máscara de la zona limpia y,
 * adentro, la COPIA de la imagen con el filtro. Separados a propósito: con el
 * filtro y la máscara en el mismo elemento, cada movimiento de la máscara
 * volvía a correr el filtro entero (medido: era lo que más costaba al mover el
 * mouse). La copia va en su propia capa de composición (will-change), así su
 * resultado filtrado queda rasterizado y la máscara se aplica encima sin
 * recalcularlo.
 */
function crearCapa(objetivo: HTMLElement): HTMLElement {
  const copia = objetivo.cloneNode(true) as HTMLElement;
  copia.removeAttribute('data-aberracion');
  copia.removeAttribute('id');
  copia.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  copia.querySelectorAll('[data-aberracion-capa]').forEach((n) => n.remove());
  // La copia de una <img> con sombra no tiene que duplicar la sombra.
  copia.querySelectorAll('.drop-shadow-sutil').forEach((n) => n.classList.remove('drop-shadow-sutil'));
  copia.querySelectorAll('img').forEach((img) => {
    img.alt = '';
    img.loading = 'eager';
  });
  const llenar = { position: 'absolute', inset: '0', width: '100%', height: '100%', margin: '0', maxWidth: 'none' };
  Object.assign(copia.style, llenar, { filter: `url(#${ID_FILTRO})`, willChange: 'transform' });

  const capa = document.createElement('div');
  capa.setAttribute('data-aberracion-capa', '');
  capa.setAttribute('aria-hidden', 'true');
  Object.assign(capa.style, llenar, {
    pointerEvents: 'none',
    // Zona limpia: transparente cerca del cursor, opaca lejos. --ab-mx/--ab-my
    // = cursor relativo a esta capa (los escribe actualizar()).
    maskImage: MASCARA,
    webkitMaskImage: MASCARA,
    maskComposite: 'intersect',
    webkitMaskComposite: 'source-in',
  });
  capa.appendChild(copia);
  if (getComputedStyle(objetivo).position === 'static') objetivo.style.position = 'relative';
  objetivo.appendChild(capa);
  return capa;
}

export default function AberracionCromatica() {
  const defsRef = useRef<SVGDefsElement>(null);

  useEffect(() => {
    const nodoDefs = defsRef.current;
    if (!nodoDefs) return;
    const defs: SVGDefsElement = nodoDefs;
    crearFiltro(defs);
    document.documentElement.classList.add('aberracion-activa');

    const capas = new Map<HTMLElement, Capa>();
    const titulos = new Map<HTMLElement, Titulo>();
    let mouse = { x: FUERA, y: FUERA };

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const el = e.target as HTMLElement;
          const c = capas.get(el);
          if (c) c.visible = e.isIntersecting;
          const t = titulos.get(el);
          if (t) t.visible = e.isIntersecting;
        }
        actualizar();
      },
      { rootMargin: '100px' },
    );

    function escanear() {
      const actuales = new Set(document.querySelectorAll<HTMLElement>('[data-aberracion]'));
      for (const [el, c] of capas) {
        if (actuales.has(el) && el.contains(c.capa)) continue;
        io.unobserve(el);
        c.capa.remove();
        capas.delete(el);
      }
      for (const [el] of titulos) {
        if (actuales.has(el)) continue;
        io.unobserve(el);
        titulos.delete(el);
      }
      for (const el of actuales) {
        if (capas.has(el) || titulos.has(el)) continue;
        if (el.dataset.aberracion === 'texto') {
          titulos.set(el, { el, visible: false, intensidad: -1 });
        } else {
          capas.set(el, { objetivo: el, capa: crearCapa(el), visible: false, ax: NaN, ay: NaN });
        }
        io.observe(el);
      }
    }

    // Lecturas primero (rects), escrituras después: sin layout thrashing.
    function actualizar() {
      const lecturas: [Capa | Titulo, number, number][] = [];
      for (const c of capas.values()) {
        if (!c.visible) continue;
        const r = c.capa.getBoundingClientRect();
        // La zona limpia sólo alcanza R_PLENO alrededor del cursor: si la capa
        // está más lejos, su máscara queda fija en "sin zona limpia" y no se
        // vuelve a tocar (repintar las máscaras de todas las capas en cada
        // movimiento era lo que más costaba).
        const lejos =
          mouse.x < r.left - R_PLENO || mouse.x > r.right + R_PLENO ||
          mouse.y < r.top - R_PLENO || mouse.y > r.bottom + R_PLENO;
        if (lejos) lecturas.push([c, FUERA, FUERA]);
        else lecturas.push([c, mouse.x - r.left, mouse.y - r.top]);
      }
      for (const t of titulos.values()) {
        if (!t.visible) continue;
        const r = t.el.getBoundingClientRect();
        // Distancia del cursor al rectángulo del título (0 si está encima).
        const dx = Math.max(r.left - mouse.x, 0, mouse.x - r.right);
        const dy = Math.max(r.top - mouse.y, 0, mouse.y - r.bottom);
        lecturas.push([t, Math.hypot(dx, dy), 0]);
      }
      for (const [o, a, b] of lecturas) {
        if ('capa' in o) {
          if (Math.abs(a - o.ax) < 0.5 && Math.abs(b - o.ay) < 0.5) continue;
          o.ax = a;
          o.ay = b;
          o.capa.style.setProperty('--ab-mx', `${a.toFixed(1)}px`);
          o.capa.style.setProperty('--ab-my', `${b.toFixed(1)}px`);
        } else {
          const i = mouse.x === FUERA ? 1 : suave((a - 0) / TEXTO_PLENO);
          if (Math.abs(i - o.intensidad) < 0.02) continue;
          o.intensidad = i;
          o.el.style.setProperty('--ab-t', (TEXTO_MAX * i).toFixed(2));
        }
      }
    }

    let timerEscaneo: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver((registros) => {
      // Ignorar las mutaciones que provocan nuestras propias capas.
      const propias = registros.every((r) =>
        [...r.addedNodes, ...r.removedNodes].every((n) => n instanceof HTMLElement && n.hasAttribute('data-aberracion-capa')),
      );
      if (propias) return;
      clearTimeout(timerEscaneo);
      timerEscaneo = setTimeout(escanear, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    escanear();

    const desuscribir = suscribirRaton({
      mover(m) {
        mouse = { x: m.x, y: m.y };
      },
      salir() {
        mouse = { x: FUERA, y: FUERA };
        actualizar();
      },
      frame() {
        actualizar();
        return false; // no necesita frames propios: corre cuando el mouse o el scroll despiertan el loop
      },
    });

    return () => {
      desuscribir();
      mo.disconnect();
      io.disconnect();
      clearTimeout(timerEscaneo);
      for (const c of capas.values()) c.capa.remove();
      for (const t of titulos.values()) t.el.style.removeProperty('--ab-t');
      document.documentElement.classList.remove('aberracion-activa');
      defs.replaceChildren();
    };
  }, []);

  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs ref={defsRef} />
    </svg>
  );
}
