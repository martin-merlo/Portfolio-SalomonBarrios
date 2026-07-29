'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import type { Obra } from '@/lib/tipos';
import { fondoImagen } from '@/lib/imagen';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

interface VisorProps {
  obra: Obra;
  indice: number;
  total: number;
  onCerrar: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Visor de detalle — zoom/pan/pinch portado de referencia/demos/visor.html.
 * Suma sobre la demo: navegación entre obras, barra de metadatos, y control
 * para alternar entre imagen principal / imagen hover cuando la obra la tiene.
 * El param ?obra= en la URL lo maneja el componente padre (Work.tsx).
 */
export default function Visor({ obra, indice, total, onCerrar, onPrev, onNext }: VisorProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [imagenAlterna, setImagenAlterna] = useState(false);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const estado = useRef({
    scale: 1,
    posX: 0,
    posY: 0,
    stageRect: null as DOMRect | null,
  });

  useEffect(() => {
    setImagenAlterna(false);
  }, [obra.id]);

  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCerrar();
      else if (e.key === 'ArrowLeft') onPrev();
      else if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCerrar, onPrev, onNext]);

  useEffect(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const qx = gsap.quickTo(img, 'x', { duration: reducedMotion ? 0 : 0.35, ease: 'power3.out' });
    const qy = gsap.quickTo(img, 'y', { duration: reducedMotion ? 0 : 0.35, ease: 'power3.out' });
    const qs = gsap.quickTo(img, 'scale', { duration: reducedMotion ? 0 : 0.35, ease: 'power3.out' });

    const s = estado.current;

    function clampPos() {
      if (!s.stageRect) return;
      const minX = s.stageRect.width - s.stageRect.width * s.scale;
      const minY = s.stageRect.height - s.stageRect.height * s.scale;
      s.posX = clamp(s.posX, minX, 0);
      s.posY = clamp(s.posY, minY, 0);
    }

    function applyTransform() {
      clampPos();
      qx(s.posX);
      qy(s.posY);
      qs(s.scale);
      setZoomPct(Math.round(s.scale * 100));
    }

    function resetView() {
      s.scale = 1;
      s.posX = 0;
      s.posY = 0;
      requestAnimationFrame(() => {
        s.stageRect = stage!.getBoundingClientRect();
        gsap.set(img, { x: 0, y: 0, scale: 1 });
        setZoomPct(100);
      });
    }
    resetView();

    function onResize() {
      s.stageRect = stage!.getBoundingClientRect();
    }
    window.addEventListener('resize', onResize);

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = stage!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0016;
      const newScale = clamp(s.scale + delta * s.scale, MIN_SCALE, MAX_SCALE);
      s.posX = mx - (mx - s.posX) * (newScale / s.scale);
      s.posY = my - (my - s.posY) * (newScale / s.scale);
      s.scale = newScale;
      applyTransform();
    }
    stage.addEventListener('wheel', onWheel, { passive: false });

    function onDblClick(e: MouseEvent) {
      const rect = stage!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const target = s.scale > 1.4 ? 1 : 2.6;
      s.posX = mx - (mx - s.posX) * (target / s.scale);
      s.posY = my - (my - s.posY) * (target / s.scale);
      s.scale = target;
      applyTransform();
    }
    stage.addEventListener('dblclick', onDblClick);

    const pointers = new Map<number, { x: number; y: number }>();
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let lastPinchDist: number | null = null;

    function dist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
      return Math.hypot(p1.x - p2.x, p1.y - p2.y);
    }
    function mid(p1: { x: number; y: number }, p2: { x: number; y: number }) {
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    function onPointerDown(e: PointerEvent) {
      stage!.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        stage!.classList.add('cursor-grabbing');
      } else if (pointers.size === 2) {
        dragging = false;
        const pts = [...pointers.values()];
        lastPinchDist = dist(pts[0], pts[1]);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 1 && dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        s.posX += dx;
        s.posY += dy;
        applyTransform();
      } else if (pointers.size === 2 && lastPinchDist !== null) {
        const pts = [...pointers.values()];
        const d = dist(pts[0], pts[1]);
        const rect = stage!.getBoundingClientRect();
        const m = mid(pts[0], pts[1]);
        const mx = m.x - rect.left;
        const my = m.y - rect.top;

        const newScale = clamp(s.scale * (d / lastPinchDist), MIN_SCALE, MAX_SCALE);
        s.posX = mx - (mx - s.posX) * (newScale / s.scale);
        s.posY = my - (my - s.posY) * (newScale / s.scale);
        s.scale = newScale;
        lastPinchDist = d;
        applyTransform();
      }
    }

    function endPointer(e: PointerEvent) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) lastPinchDist = null;
      if (pointers.size === 0) {
        dragging = false;
        stage!.classList.remove('cursor-grabbing');
      } else if (pointers.size === 1) {
        const remaining = [...pointers.values()][0];
        lastX = remaining.x;
        lastY = remaining.y;
        dragging = true;
      }
    }

    stage.addEventListener('pointerdown', onPointerDown);
    stage.addEventListener('pointermove', onPointerMove);
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);

    return () => {
      window.removeEventListener('resize', onResize);
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('dblclick', onDblClick);
      stage.removeEventListener('pointerdown', onPointerDown);
      stage.removeEventListener('pointermove', onPointerMove);
      stage.removeEventListener('pointerup', endPointer);
      stage.removeEventListener('pointercancel', endPointer);
    };
  }, [obra.id, imagenAlterna]);

  const puedeAlternar = obra.tieneHover && !!obra.imagenHoverUrl;
  const imagenMostrada = imagenAlterna && puedeAlternar ? obra.imagenHoverUrl! : obra.imagenUrl;

  if (!montado) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visor de la obra ${obra.titulo}`}
      className="fixed inset-0 z-[100] bg-tinta/95 flex items-center justify-center"
      onClick={onCerrar}
    >
      <button
        ref={closeBtnRef}
        onClick={(e) => {
          e.stopPropagation();
          onCerrar();
        }}
        className="absolute top-5 right-6 sm:top-6 sm:right-8 z-10 font-mono text-xs sm:text-sm text-claro border border-claro/40 rounded-full px-4 py-2 hover:border-claro transition-colors"
      >
        ✕ Cerrar
      </button>

      <div className="absolute top-5 left-6 sm:top-6 sm:left-8 z-10 font-mono text-xs text-claro/70 tracking-wide">
        {zoomPct}%
      </div>

      {total > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Obra anterior"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 font-mono text-claro text-2xl w-11 h-11 flex items-center justify-center rounded-full border border-claro/30 hover:border-claro transition-colors"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Obra siguiente"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 font-mono text-claro text-2xl w-11 h-11 flex items-center justify-center rounded-full border border-claro/30 hover:border-claro transition-colors"
          >
            ›
          </button>
        </>
      )}

      {puedeAlternar && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setImagenAlterna((v) => !v);
          }}
          className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-10 font-mono text-xs sm:text-sm text-claro border border-claro/40 rounded-full px-4 py-2 hover:border-claro transition-colors"
        >
          {imagenAlterna ? 'Ver imagen principal' : 'Ver segunda imagen'}
        </button>
      )}

      <div
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[min(90vw,1100px)] h-[min(76vh,1100px)] overflow-hidden rounded-sm cursor-grab touch-none"
      >
        <div
          ref={imgRef}
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: fondoImagen(imagenMostrada),
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        />
      </div>

      <div
        className="absolute bottom-0 inset-x-0 z-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 px-6 py-4 font-mono text-[0.7rem] sm:text-xs text-claro/70"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-claro">{obra.titulo}</span>
        <span>{obra.tecnica}</span>
        <span>{obra.anio}</span>
        <span>{obra.dimensiones}</span>
        {total > 1 && (
          <span>
            {indice + 1} / {total}
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}
