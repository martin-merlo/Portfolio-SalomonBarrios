/**
 * Único origen de la posición del mouse para los efectos del sitio público
 * (cursor custom y aberración cromática). UN listener de mousemove y UN loop de
 * requestAnimationFrame compartidos: los efectos se suscriben en vez de leer el
 * mouse cada uno por su cuenta, así por frame se hace el trabajo una sola vez.
 *
 * - El listener sólo guarda la posición y despierta el loop (nada de layout).
 * - El loop calcula la velocidad (suavizada) y llama a cada suscriptor; sigue
 *   corriendo mientras alguno pida más frames (p. ej. el círculo del cursor
 *   todavía llegando, o la aberración todavía apagándose) y se duerme cuando
 *   ninguno lo necesita — en reposo no corre nada.
 * - Los listeners del document se ponen con el primer suscriptor y se sacan
 *   con el último.
 */

export interface EstadoRaton {
  x: number;
  y: number;
  /** Velocidad suavizada del puntero, en px/s. Decae a 0 con el mouse quieto. */
  velocidad: number;
  /** El mouse está dentro de la ventana. */
  dentro: boolean;
}

export interface SuscriptorRaton {
  /** En cada mousemove (sincrónico, barato: nada de layout acá). */
  mover?(m: EstadoRaton): void;
  /** El mouse salió de la ventana. */
  salir?(): void;
  /** Una vez por frame; devolver true si todavía hacen falta más frames. */
  frame?(m: EstadoRaton, dt: number): boolean;
}

// Rapidez (1/s) del suavizado de la velocidad: sube rápido al moverse y baja
// en ~0.3s cuando el mouse se queda quieto.
const SUAVIZADO_VELOCIDAD = 10;

const estado: EstadoRaton = { x: 0, y: 0, velocidad: 0, dentro: false };
const suscriptores = new Set<SuscriptorRaton>();
let raf = 0;
let ultimoFrame = 0;
let previo = { x: 0, y: 0 };

function frame(t: number) {
  const dt = Math.min((t - ultimoFrame) / 1000, 0.1);
  ultimoFrame = t;
  if (dt > 0) {
    const instantanea = Math.hypot(estado.x - previo.x, estado.y - previo.y) / dt;
    estado.velocidad += (instantanea - estado.velocidad) * (1 - Math.exp(-SUAVIZADO_VELOCIDAD * dt));
    if (estado.velocidad < 0.5) estado.velocidad = 0;
  }
  previo = { x: estado.x, y: estado.y };

  let seguir = estado.velocidad > 0;
  suscriptores.forEach((s) => {
    if (s.frame?.(estado, dt)) seguir = true;
  });
  raf = seguir ? requestAnimationFrame(frame) : 0;
}

function despertar() {
  if (raf) return;
  ultimoFrame = performance.now();
  raf = requestAnimationFrame(frame);
}

function onMove(e: MouseEvent) {
  if (!estado.dentro) previo = { x: e.clientX, y: e.clientY }; // sin salto de velocidad al entrar
  estado.x = e.clientX;
  estado.y = e.clientY;
  estado.dentro = true;
  suscriptores.forEach((s) => s.mover?.(estado));
  despertar();
}

function onSalir() {
  estado.dentro = false;
  estado.velocidad = 0;
  suscriptores.forEach((s) => s.salir?.());
}

function onOut(e: MouseEvent) {
  // relatedTarget null = el mouse salió de la ventana.
  if (!e.relatedTarget) onSalir();
}

export function suscribirRaton(s: SuscriptorRaton): () => void {
  if (suscriptores.size === 0) {
    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });
    window.addEventListener('blur', onSalir);
  }
  suscriptores.add(s);
  return () => {
    suscriptores.delete(s);
    if (suscriptores.size === 0) {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('blur', onSalir);
      cancelAnimationFrame(raf);
      raf = 0;
      estado.dentro = false;
      estado.velocidad = 0;
    }
  };
}

/** Pide al menos un frame más (p. ej. al cambiar algo que hay que redibujar). */
export function pedirFrame() {
  if (suscriptores.size > 0) despertar();
}
