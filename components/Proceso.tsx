'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ImagenProceso } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';
import { MARGEN_PAPEL } from '@/lib/estilos';

gsap.registerPlugin(ScrollTrigger);

function Card({ item }: { item: ImagenProceso }) {
  return (
    <div className="relative w-[220px] h-[280px] sm:w-[280px] sm:h-[340px] shrink-0 mx-2 sm:mx-3 overflow-hidden rounded-sm">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: fondoImagen(item.imagenUrl) }}
      />
      <p className="absolute bottom-0 inset-x-0 font-mono text-claro text-[0.7rem] sm:text-xs px-3 py-2 bg-tinta/45">
        {item.textoCorto}
      </p>
    </div>
  );
}

// Segundos que tarda el auto-play en recorrer una tanda completa de items
// (media tira) — misma velocidad que tenía el tween original.
const SEGUNDOS_POR_ITEM = 5;
// Cuánto del scroll se transmite al carrusel: px/s de carrusel por px/s de
// scroll. 0.5 = el carrusel avanza a la mitad de la velocidad del scroll.
const FACTOR_SCROLL = 0.5;
// Tope del impulso (px/s) para que un flick muy fuerte no lo haga volar.
const IMPULSO_MAX = 1800;
// Constantes de tiempo (s) del suavizado exponencial. TAU_IMPULSO: cuánto
// tarda en apagarse el empuje del scroll cuando el scroll se detiene.
// TAU_VELOCIDAD: cuánto tarda la velocidad real en alcanzar la objetivo
// (evita saltos al empezar/terminar el scroll y al entrar/salir el mouse).
const TAU_IMPULSO = 0.35;
const TAU_VELOCIDAD = 0.18;

/**
 * Carrusel en loop continuo (auto-play) sincronizado con el scroll.
 *
 * Sin prefers-reduced-motion: tira duplicada + posición en xPercent envuelta
 * en [0, -50%) — como las dos mitades son idénticas, el salto de -50% a 0 es
 * invisible (loop sin costuras). En vez de un tween fijo, la posición se
 * integra en el ticker de GSAP con una velocidad que es la suma de:
 *   - el auto-play base (0 con el mouse encima: pausa al hover), y
 *   - un impulso que viene del scroll: mientras la sección está en pantalla,
 *     un ScrollTrigger lee la velocidad del scroll de la página; scrollear
 *     hacia abajo adelanta el carrusel, hacia arriba lo hace retroceder.
 * Cuando el scroll para, el impulso decae exponencialmente y la velocidad
 * vuelve sola al auto-play, sin saltos. El impulso se aplica aun con el mouse
 * encima: el carrusel ocupa todo el ancho, así que casi siempre se scrollea
 * con el cursor sobre él.
 *
 * Con reduced-motion: tira simple, sin duplicar, con scroll horizontal nativo
 * (sin loop, sin auto-play y sin sincronía con el scroll).
 *
 * El arrastre manual (drag con pointer events) se quitó a pedido del cliente.
 */
export default function Proceso({ items }: { items: ImagenProceso[] }) {
  const seccionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const [loopHabilitado, setLoopHabilitado] = useState(false);

  useEffect(() => {
    setLoopHabilitado(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!loopHabilitado) return;
    const track = trackRef.current;
    const seccion = seccionRef.current;
    if (!track || !seccion) return;

    const duracion = items.length * SEGUNDOS_POR_ITEM;
    const setX = gsap.quickSetter(track, 'xPercent');
    let mitadPx = track.offsetWidth / 2; // ancho de una tanda de items
    let progreso = 0; // 0..1 dentro de la media tira
    let velocidad = 0; // px/s reales (suavizados)
    let impulso = 0; // px/s aportados por el scroll

    const ro = new ResizeObserver(() => {
      mitadPx = track.offsetWidth / 2;
    });
    ro.observe(track);

    const st = ScrollTrigger.create({
      trigger: seccion,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        impulso = gsap.utils.clamp(-IMPULSO_MAX, IMPULSO_MAX, self.getVelocity() * FACTOR_SCROLL);
      },
    });

    function tick(_tiempo: number, deltaMs: number) {
      if (mitadPx <= 0) return;
      // Tope de dt: al volver de una pestaña oculta no pega un salto.
      const dt = Math.min(deltaMs, 100) / 1000;
      impulso *= Math.exp(-dt / TAU_IMPULSO);
      const base = hoverRef.current ? 0 : mitadPx / duracion;
      velocidad += (base + impulso - velocidad) * (1 - Math.exp(-dt / TAU_VELOCIDAD));
      progreso = (((progreso + (velocidad * dt) / mitadPx) % 1) + 1) % 1;
      setX(-50 * progreso);
    }
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      st.kill();
      ro.disconnect();
      gsap.set(track, { clearProps: 'transform' });
    };
  }, [loopHabilitado, items.length]);

  if (!loopHabilitado) {
    return (
      <section aria-label="Proceso de trabajo" className="py-10 sm:py-16">
        <div className={`flex overflow-x-auto ${MARGEN_PAPEL}`}>
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  }

  const doble = [...items, ...items];

  return (
    <section ref={seccionRef} aria-label="Proceso de trabajo" className="overflow-hidden py-10 sm:py-16">
      <div
        className="overflow-hidden"
        onMouseEnter={() => (hoverRef.current = true)}
        onMouseLeave={() => (hoverRef.current = false)}
      >
        <div ref={trackRef} className="flex w-max">
          {doble.map((item, i) => (
            <Card key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
