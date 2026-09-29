'use client';

import { useEffect, useRef } from 'react';
import { suscribirRaton } from '@/lib/raton';
import { useEfectosMouse } from '@/lib/useEfectosMouse';

/**
 * Aberración cromática sutil que reacciona al mouse (versión liviana CSS/SVG,
 * sin WebGL).
 *
 * Qué hace: separa los canales de color (rojo hacia un lado, cian hacia el
 * otro) unos pocos píxeles, sólo MIENTRAS el mouse se mueve (la intensidad sigue
 * a la velocidad del puntero y se apaga suave cuando se queda quieto). Cada
 * elemento se desplaza en la dirección cursor → elemento, más cuanto más lejos
 * está del cursor y casi nada justo donde está el puntero (efecto "lente"
 * centrado en el mouse).
 *
 * Dónde: sólo en lo que se marca con `data-aberracion`:
 *   - "imagen": las obras (galería, carrusel de proceso, imágenes de los
 *     bloques de obra). Filtro SVG real de separación de canales
 *     (feColorMatrix + feOffset + feBlend screen), uno por elemento.
 *   - "texto": los títulos grandes del hero. Separación con text-shadow
 *     rojo/cian por variables CSS (mucho más barato que un filtro).
 *   Nunca en párrafos ni texto de lectura.
 *
 * Rendimiento:
 *   - No tiene listener ni loop propios: se suscribe al store compartido
 *     lib/raton.ts (el mismo del cursor custom). Un solo lugar lee el mouse.
 *   - Sólo trabaja sobre los elementos visibles (IntersectionObserver).
 *   - En reposo el filtro se QUITA del elemento (no queda un filtro "en 0"
 *     costando render): cero costo con el mouse quieto.
 *   - Lecturas de posición primero, escrituras después (sin layout thrashing).
 *   - Se descubre contenido dinámico (obras/bloques de Supabase) con un
 *     MutationObserver, no con un querySelectorAll único al montar.
 *
 * Desactivado en /panel, en touch (no hay mouse) y con prefers-reduced-motion.
 */

type Tipo = 'imagen' | 'texto';

interface Objetivo {
  el: HTMLElement;
  tipo: Tipo;
  visible: boolean;
  activo: boolean;
  dx: number;
  dy: number;
  filtro?: { id: string; rojo: SVGFEOffsetElement; cian: SVGFEOffsetElement };
}

// Desplazamiento máximo (px) de cada canal a intensidad plena y lejos del cursor.
// Imágenes 1.6px: sobre obras con mucho detalle cada contorno se tiñe, así que
// con más (se probó 2.2px) deja de ser un toque y pasa a efecto llamativo.
const MAX_PX: Record<Tipo, number> = { imagen: 1.6, texto: 1.6 };
// Velocidad del mouse (px/s) a la que el efecto llega al 100%.
const VELOCIDAD_PLENA = 1600;
// Distancia (px) del cursor: por debajo de CERCA casi no hay efecto, a partir
// de LEJOS (fracción de la diagonal de la ventana) es pleno.
const CERCA = 60;
const LEJOS = 0.55;
// Suavizado (1/s) de la intensidad: sube rápido, baja más lento (se apaga suave).
const SUBIDA = 9;
const BAJADA = 2.5;
// Por debajo de esto (px) el filtro se quita del elemento.
const UMBRAL = 0.06;

const SVGNS = 'http://www.w3.org/2000/svg';

function suave(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
}

export default function AberracionCromatica() {
  const { disponible, reducido } = useEfectosMouse();
  if (!disponible || reducido) return null;
  return <Aberracion />;
}

function Aberracion() {
  const defsRef = useRef<SVGDefsElement>(null);

  useEffect(() => {
    const nodoDefs = defsRef.current;
    if (!nodoDefs) return;
    const defs: SVGDefsElement = nodoDefs;

    const objetivos = new Map<HTMLElement, Objetivo>();
    let contador = 0;
    let intensidad = 0;

    const io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const o = objetivos.get(e.target as HTMLElement);
          if (o) o.visible = e.isIntersecting;
        }
      },
      { rootMargin: '80px' },
    );

    function crearFiltro(): Objetivo['filtro'] {
      const id = `aberracion-${++contador}`;
      const f = document.createElementNS(SVGNS, 'filter');
      f.setAttribute('id', id);
      f.setAttribute('color-interpolation-filters', 'sRGB');
      f.setAttribute('x', '-3%');
      f.setAttribute('y', '-3%');
      f.setAttribute('width', '106%');
      f.setAttribute('height', '106%');
      const matriz = (valores: string, result: string) => {
        const m = document.createElementNS(SVGNS, 'feColorMatrix');
        m.setAttribute('in', 'SourceGraphic');
        m.setAttribute('type', 'matrix');
        m.setAttribute('values', valores);
        m.setAttribute('result', result);
        return m;
      };
      const offset = (entrada: string, result: string) => {
        const o = document.createElementNS(SVGNS, 'feOffset');
        o.setAttribute('in', entrada);
        o.setAttribute('dx', '0');
        o.setAttribute('dy', '0');
        o.setAttribute('result', result);
        return o;
      };
      const rojo = offset('r', 'r2');
      const cian = offset('gb', 'gb2');
      const mezcla = document.createElementNS(SVGNS, 'feBlend');
      mezcla.setAttribute('in', 'r2');
      mezcla.setAttribute('in2', 'gb2');
      mezcla.setAttribute('mode', 'screen');
      // Canal rojo solo / verde+azul (cian) solo; screen los vuelve a sumar:
      // con desplazamiento 0 es la imagen original, al separarlos aparecen los
      // bordes rojo/cian.
      f.append(
        matriz('1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r'),
        rojo,
        matriz('0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0', 'gb'),
        cian,
        mezcla,
      );
      defs.appendChild(f);
      return { id, rojo, cian };
    }

    function escanear() {
      const actuales = new Set(document.querySelectorAll<HTMLElement>('[data-aberracion]'));
      // Bajas
      for (const [el, o] of objetivos) {
        if (actuales.has(el)) continue;
        io.unobserve(el);
        if (o.filtro) document.getElementById(o.filtro.id)?.remove();
        objetivos.delete(el);
      }
      // Altas
      for (const el of actuales) {
        if (objetivos.has(el)) continue;
        const tipo: Tipo = el.dataset.aberracion === 'texto' ? 'texto' : 'imagen';
        objetivos.set(el, { el, tipo, visible: false, activo: false, dx: 0, dy: 0 });
        io.observe(el);
      }
    }

    let timerEscaneo: ReturnType<typeof setTimeout> | undefined;
    const mo = new MutationObserver(() => {
      clearTimeout(timerEscaneo);
      timerEscaneo = setTimeout(escanear, 150);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    escanear();

    function apagar(o: Objetivo) {
      if (!o.activo) return;
      o.activo = false;
      o.dx = o.dy = 0;
      if (o.tipo === 'imagen') {
        o.el.style.removeProperty('filter');
      } else {
        o.el.removeAttribute('data-aberracion-activa');
      }
    }

    const desuscribir = suscribirRaton({
      frame(m, dt) {
        const objetivo = m.dentro ? suave(m.velocidad / VELOCIDAD_PLENA) : 0;
        const k = objetivo > intensidad ? SUBIDA : BAJADA;
        intensidad += (objetivo - intensidad) * (1 - Math.exp(-k * dt));
        if (intensidad < 0.002) intensidad = 0;

        const lejos = Math.hypot(window.innerWidth, window.innerHeight) * LEJOS;

        // 1) Lecturas: posición de los visibles.
        const calculos: [Objetivo, number, number][] = [];
        for (const o of objetivos.values()) {
          if (!o.visible || intensidad === 0) {
            apagar(o);
            continue;
          }
          const r = o.el.getBoundingClientRect();
          const vx = r.left + r.width / 2 - m.x;
          const vy = r.top + r.height / 2 - m.y;
          const dist = Math.hypot(vx, vy) || 1;
          const px = MAX_PX[o.tipo] * intensidad * suave((dist - CERCA) / (lejos - CERCA));
          calculos.push([o, (vx / dist) * px, (vy / dist) * px]);
        }

        // 2) Escrituras.
        for (const [o, dx, dy] of calculos) {
          if (Math.abs(dx) + Math.abs(dy) < UMBRAL) {
            apagar(o);
            continue;
          }
          if (Math.abs(dx - o.dx) + Math.abs(dy - o.dy) < 0.03 && o.activo) continue;
          o.dx = dx;
          o.dy = dy;
          if (o.tipo === 'imagen') {
            if (!o.filtro) o.filtro = crearFiltro();
            const f = o.filtro!;
            f.rojo.setAttribute('dx', dx.toFixed(2));
            f.rojo.setAttribute('dy', dy.toFixed(2));
            f.cian.setAttribute('dx', (-dx).toFixed(2));
            f.cian.setAttribute('dy', (-dy).toFixed(2));
            if (!o.activo) o.el.style.filter = `url(#${f.id})`;
          } else {
            o.el.style.setProperty('--ab-x', dx.toFixed(2));
            o.el.style.setProperty('--ab-y', dy.toFixed(2));
            if (!o.activo) o.el.setAttribute('data-aberracion-activa', '');
          }
          o.activo = true;
        }
        return intensidad > 0;
      },
    });

    return () => {
      desuscribir();
      mo.disconnect();
      io.disconnect();
      clearTimeout(timerEscaneo);
      for (const o of objetivos.values()) apagar(o);
      defs.replaceChildren();
    };
  }, []);

  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs ref={defsRef} />
    </svg>
  );
}
