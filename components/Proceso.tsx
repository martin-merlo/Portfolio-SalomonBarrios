'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { ImagenProceso } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';

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

/**
 * Carrusel en loop continuo. Sin prefers-reduced-motion: tira duplicada +
 * tween GSAP en xPercent de 0 a -50% (loop sin costuras), pausable con el
 * mouse encima y arrastrable con pointer events. Con reduced-motion: tira
 * simple, sin duplicar, con scroll horizontal nativo (sin loop ni auto-play).
 */
export default function Proceso({ items }: { items: ImagenProceso[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const [loopHabilitado, setLoopHabilitado] = useState(false);

  useEffect(() => {
    setLoopHabilitado(!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (!loopHabilitado) return;
    const track = trackRef.current;
    if (!track) return;

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: items.length * 5,
      ease: 'none',
      repeat: -1,
    });
    tweenRef.current = tween;

    let dragging = false;
    let startX = 0;
    let startXPercent = 0;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      tween.pause();
      startX = e.clientX;
      startXPercent = gsap.getProperty(track, 'xPercent') as number;
      track!.setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const trackWidth = track!.scrollWidth / 2;
      const deltaPercent = (dx / trackWidth) * 100;
      gsap.set(track, { xPercent: startXPercent + deltaPercent });
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false;
      tween.play();
    }

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', onPointerUp);
    track.addEventListener('pointercancel', onPointerUp);

    return () => {
      tween.kill();
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', onPointerUp);
      track.removeEventListener('pointercancel', onPointerUp);
    };
  }, [loopHabilitado, items.length]);

  function pausar() {
    tweenRef.current?.pause();
  }
  function reanudar() {
    tweenRef.current?.play();
  }

  if (!loopHabilitado) {
    return (
      <section aria-label="Proceso de trabajo" className="py-10 sm:py-16">
        <div className="flex overflow-x-auto px-5 sm:px-10 lg:px-14">
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </div>
      </section>
    );
  }

  const doble = [...items, ...items];

  return (
    <section aria-label="Proceso de trabajo" className="overflow-hidden py-10 sm:py-16">
      <div className="overflow-hidden" onMouseEnter={pausar} onMouseLeave={reanudar}>
        <div ref={trackRef} className="flex w-max cursor-grab active:cursor-grabbing touch-pan-y">
          {doble.map((item, i) => (
            <Card key={`${item.id}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
