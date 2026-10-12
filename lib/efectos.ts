/**
 * Interruptores de la capa de efectos visuales del sitio público. Cada uno
 * prende/apaga SU efecto sin tocar los otros: es la red de seguridad de
 * rendimiento (corren todos juntos encima del cursor custom y de GSAP; si el
 * conjunto pesa, se apagan de a uno). Los monta components/EfectosVisuales.tsx.
 *
 * Además de estos flags, cada efecto respeta sus propias condiciones:
 *  - En /panel y en touch (sin mouse real) no se monta ninguno.
 *  - Con prefers-reduced-motion se apagan la aberración (reactiva al mouse) y
 *    el noise (animado); las scanlines, que son estáticas, quedan.
 */
export const EFECTOS = {
  /** Aberración cromática difuminada en imágenes de obra y títulos grandes; el cursor la "limpia" a su alrededor. */
  aberracionActiva: true,
  /** Grano de película animado sobre toda la página (textura fija que se desplaza). */
  noiseActivo: true,
  /** Líneas de barrido horizontales tipo CRT, estáticas y muy tenues. */
  scanlinesActivo: true,
} as const;
