// Clave de sessionStorage de la pantalla de carga (components/PantallaCarga.tsx).
// Vive acá y no en el componente: el layout (server component) la necesita como
// texto para el script del <head>, y lo que exporta un archivo 'use client' le
// llega al servidor como referencia de cliente, no como el valor.
export const CLAVE_CARGA = 'sb-cargado';
