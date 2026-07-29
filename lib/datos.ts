import { contenidoSitioMock, obrasMock, procesoMock } from './mocks';
import type { ContenidoSitio, ImagenProceso, Obra } from './tipos';

export async function getObras(): Promise<Obra[]> {
  return [...obrasMock].sort((a, b) => a.orden - b.orden);
}

export async function getProceso(): Promise<ImagenProceso[]> {
  return [...procesoMock].sort((a, b) => a.orden - b.orden);
}

export async function getContenido(): Promise<ContenidoSitio> {
  return contenidoSitioMock;
}
