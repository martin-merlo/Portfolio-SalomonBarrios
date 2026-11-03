'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Foto de la bio cuando faltan las medidas guardadas (caso borde): no se puede
 * reservar el espacio, así que al cargar corre todo lo que sigue y ScrollTrigger
 * tiene que recalcular sus posiciones. El efecto cubre la imagen que ya cargó
 * antes de que React se hidratara, cuando onLoad no llega a dispararse.
 */
export default function FotoBioSinMedidas({ url, alt }: { url: string; alt: string }) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) ScrollTrigger.refresh();
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={imgRef} src={url} alt={alt} className="block w-full h-auto" onLoad={() => ScrollTrigger.refresh()} />
  );
}
