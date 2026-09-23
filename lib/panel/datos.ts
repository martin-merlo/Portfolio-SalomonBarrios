import { createClient } from '@/lib/supabase/server';
import { mapObra } from '@/lib/mapeo';
import type { Obra } from '@/lib/tipos';
import type { ObraRow } from '@/lib/mapeo';

/**
 * Lecturas del panel: a diferencia de lib/datos.ts (público, anónimo,
 * sólo obras publicadas), acá usamos el cliente con cookies de sesión para
 * que el artista vea también los borradores (RLS deja pasar todo a un
 * usuario autenticado). Las escrituras del panel no viven acá — se hacen
 * directo desde los componentes de cliente con el browser client, como pide
 * el enunciado ("ya autenticado, la policy ya lo permite").
 */
export async function getTodasLasObras(): Promise<Obra[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('obras').select('*').order('orden', { ascending: true });

  if (error) {
    console.error('Error al cargar obras (panel):', error.message);
    return [];
  }

  return (data as ObraRow[]).map(mapObra);
}

export async function getObraPorId(id: string): Promise<Obra | null> {
  const supabase = await createClient();

  const { data: obraRow, error } = await supabase.from('obras').select('*').eq('id', id).maybeSingle();
  if (error || !obraRow) return null;

  return mapObra(obraRow as ObraRow);
}
