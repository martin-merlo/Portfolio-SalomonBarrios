/** minúsculas, sin tildes, espacios/símbolos raros -> guiones, sin guiones sobrantes. */
export function slugify(texto: string): string {
  // NFD separa la letra base de su marca diacrítica (acento); filtramos esas
  // marcas por código de punto en vez de con un rango unicode en un regex
  // literal, para no depender de cómo el editor/fuente represente esos
  // caracteres combinantes.
  const sinDiacriticos = Array.from(texto.normalize('NFD'))
    .filter((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return !(codigo >= 0x0300 && codigo <= 0x036f);
    })
    .join('');

  return sinDiacriticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}
