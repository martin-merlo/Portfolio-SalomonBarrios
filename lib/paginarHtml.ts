/**
 * Paginación de texto enriquecido (HTML ya sanitizado: p, br, strong, em, ul,
 * ol, li, a) midiendo el ALTO REAL del contenido renderizado — lo usan el CV y
 * la declaración del artista (ver usePaginacion).
 *
 * Cómo funciona:
 *  1. El HTML se aplana a una secuencia de PALABRAS ("átomos"). Cada una sabe a
 *     qué bloque pertenece (párrafo o ítem de lista) y con qué formato va cada
 *     trozo (una palabra puede ser mitad negrita: "neg<strong>rita</strong>").
 *  2. Una página es un rango contiguo de palabras. Para medirla se arma su HTML
 *     (reabriendo párrafos, listas y formato) en un clon oculto con la misma
 *     tipografía y ancho que la caja visible, y se compara su alto con el de la
 *     caja. Búsqueda binaria del máximo de palabras que entran.
 *  3. Los cortes caen SIEMPRE entre palabras: nunca se parte una palabra, y el
 *     formato no se rompe (una negrita cortada sigue en negrita en la página
 *     siguiente).
 *  4. Listas: un ítem que no entra entero pasa completo a la página siguiente
 *     (salvo que él solo sea más alto que una página, único caso en que se
 *     parte). Una lista numerada que sigue en otra página sigue la numeración
 *     (start), y la continuación de un ítem partido no repite la viñeta
 *     (clase "continua", ver globals.css).
 *
 * El HTML que sale se arma desde cero (texto escapado + sólo las etiquetas de
 * arriba), así que es seguro por construcción aunque la entrada no lo fuera.
 */

type Marca = { tag: 'strong' | 'em' } | { tag: 'a'; href: string };

interface Trozo {
  texto: string;
  marcas: Marca[];
}

interface Atomo {
  bloque: number;
  /** Palabra (con su espacio final) en uno o más trozos; vacío si es un <br>. */
  trozos: Trozo[];
  br?: boolean;
}

type Bloque =
  | { tipo: 'p' }
  | { tipo: 'li'; lista: 'ul' | 'ol'; listaId: number; numero: number };

interface Documento {
  bloques: Bloque[];
  atomos: Atomo[];
  /** Índice del primer y último átomo de cada bloque. */
  primero: number[];
  ultimo: number[];
}

// ---------------------------------------------------------------- parseo

export function parsearHtml(html: string): Documento {
  const bloques: Bloque[] = [];
  const atomos: Atomo[] = [];
  let listaId = 0;

  const raiz = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;

  // Átomo en construcción (palabra a medio armar) del bloque actual.
  let actual: Atomo | null = null;
  let bloqueActual = -1;
  // Bloque implícito para texto suelto fuera de un <p>.
  let implicito = false;

  function nuevoBloque(b: Bloque) {
    cerrarAtomo();
    bloques.push(b);
    bloqueActual = bloques.length - 1;
    implicito = false;
  }

  function cerrarAtomo() {
    if (actual && actual.trozos.length) atomos.push(actual);
    actual = null;
  }

  function agregarTexto(texto: string, marcas: Marca[]) {
    // Separa en palabras y espacios; el espacio queda pegado a la palabra
    // anterior y la cierra.
    for (const parte of texto.split(/(\s+)/)) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) {
        if (actual) {
          actual.trozos.push({ texto: ' ', marcas });
          cerrarAtomo();
        }
        // espacio al comienzo de un bloque: se descarta
      } else {
        if (!actual) actual = { bloque: bloqueActual, trozos: [] };
        actual.trozos.push({ texto: parte, marcas });
      }
    }
  }

  function agregarBr() {
    cerrarAtomo();
    atomos.push({ bloque: bloqueActual, trozos: [], br: true });
  }

  function recorrerEnLinea(nodo: Node, marcas: Marca[]) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      agregarTexto(nodo.textContent ?? '', marcas);
      return;
    }
    if (nodo.nodeType !== Node.ELEMENT_NODE) return;
    const el = nodo as Element;
    const tag = el.tagName.toLowerCase();
    if (tag === 'br') return agregarBr();
    let nuevas = marcas;
    if (tag === 'strong' || tag === 'b') nuevas = [...marcas, { tag: 'strong' }];
    else if (tag === 'em' || tag === 'i') nuevas = [...marcas, { tag: 'em' }];
    else if (tag === 'a') nuevas = [...marcas, { tag: 'a', href: el.getAttribute('href') ?? '' }];
    el.childNodes.forEach((h) => recorrerEnLinea(h, nuevas));
  }

  function recorrerLista(lista: Element) {
    const tipo = lista.tagName.toLowerCase() === 'ol' ? 'ol' : 'ul';
    const id = ++listaId;
    let numero = 0;
    for (const hijo of Array.from(lista.children)) {
      if (hijo.tagName.toLowerCase() !== 'li') continue;
      numero++;
      nuevoBloque({ tipo: 'li', lista: tipo, listaId: id, numero });
      let parrafos = 0;
      const anidadas: Element[] = [];
      hijo.childNodes.forEach((n) => {
        const tag = n.nodeType === Node.ELEMENT_NODE ? (n as Element).tagName.toLowerCase() : '';
        if (tag === 'ul' || tag === 'ol') anidadas.push(n as Element);
        else if (tag === 'p') {
          // Segundo párrafo dentro del mismo ítem: salto de línea.
          if (parrafos++ > 0) agregarBr();
          n.childNodes.forEach((m) => recorrerEnLinea(m, []));
        } else recorrerEnLinea(n, []);
      });
      cerrarAtomo();
      // Listas anidadas (no las produce el editor): se aplanan a continuación.
      anidadas.forEach(recorrerLista);
    }
  }

  raiz.childNodes.forEach((n) => {
    const tag = n.nodeType === Node.ELEMENT_NODE ? (n as Element).tagName.toLowerCase() : '';
    if (tag === 'p') {
      nuevoBloque({ tipo: 'p' });
      n.childNodes.forEach((m) => recorrerEnLinea(m, []));
    } else if (tag === 'ul' || tag === 'ol') {
      recorrerLista(n as Element);
    } else {
      // Texto o formato suelto fuera de un párrafo: va a un párrafo implícito.
      if (n.nodeType === Node.TEXT_NODE && !(n.textContent ?? '').trim() && !implicito) return;
      if (!implicito) {
        nuevoBloque({ tipo: 'p' });
        implicito = true;
      }
      recorrerEnLinea(n, []);
    }
  });
  cerrarAtomo();

  // Un <br> al final de un bloque no aporta nada visible: fuera.
  const limpios = atomos.filter(
    (a, i) => !(a.br && (i === atomos.length - 1 || atomos[i + 1].bloque !== a.bloque)),
  );

  const primero: number[] = new Array(bloques.length).fill(-1);
  const ultimo: number[] = new Array(bloques.length).fill(-1);
  limpios.forEach((a, i) => {
    if (primero[a.bloque] === -1) primero[a.bloque] = i;
    ultimo[a.bloque] = i;
  });

  return { bloques, atomos: limpios, primero, ultimo };
}

// ---------------------------------------------------------------- armado

function escapar(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escaparAtributo(t: string): string {
  return escapar(t).replace(/"/g, '&quot;');
}

function abrir(m: Marca): string {
  if (m.tag !== 'a') return `<${m.tag}>`;
  // Mismas reglas que el sanitizador: sólo http(s), mailto y rutas del sitio;
  // externos en pestaña nueva con noopener noreferrer.
  const href = m.href.trim();
  if (!/^(https?:\/\/|mailto:|\/(?!\/))/i.test(href)) return '<a>';
  const externo = /^https?:\/\//i.test(href);
  return `<a href="${escaparAtributo(href)}"${externo ? ' target="_blank" rel="noopener noreferrer"' : ''}>`;
}

function mismaMarca(a: Marca, b: Marca): boolean {
  return a.tag === b.tag && (a.tag !== 'a' || (b.tag === 'a' && a.href === b.href));
}

/** Contenido en línea de un bloque: une trozos contiguos con el mismo formato. */
function armarEnLinea(atomos: Atomo[]): string {
  let html = '';
  let abiertas: Marca[] = [];
  const cerrarDesde = (i: number) => {
    for (let k = abiertas.length - 1; k >= i; k--) html += `</${abiertas[k].tag}>`;
    abiertas = abiertas.slice(0, i);
  };
  for (const a of atomos) {
    if (a.br) {
      cerrarDesde(0);
      html += '<br>';
      continue;
    }
    for (const t of a.trozos) {
      let comun = 0;
      while (comun < abiertas.length && comun < t.marcas.length && mismaMarca(abiertas[comun], t.marcas[comun])) comun++;
      cerrarDesde(comun);
      for (let k = comun; k < t.marcas.length; k++) {
        html += abrir(t.marcas[k]);
        abiertas.push(t.marcas[k]);
      }
      html += escapar(t.texto);
    }
  }
  cerrarDesde(0);
  return html;
}

/** HTML de la página que va del átomo `desde` (incluido) a `hasta` (excluido). */
export function armarPagina(doc: Documento, desde: number, hasta: number): string {
  let html = '';
  let listaAbierta: { id: number; tag: 'ul' | 'ol' } | null = null;
  let i = desde;
  while (i < hasta) {
    const b = doc.atomos[i].bloque;
    let j = i;
    while (j < hasta && doc.atomos[j].bloque === b) j++;
    const bloque = doc.bloques[b];
    const contenido = armarEnLinea(doc.atomos.slice(i, j));
    const continua = i > doc.primero[b];

    if (bloque.tipo === 'li') {
      if (!listaAbierta || listaAbierta.id !== bloque.listaId) {
        if (listaAbierta) html += `</${listaAbierta.tag}>`;
        const start = bloque.lista === 'ol' && bloque.numero > 1 ? ` start="${bloque.numero}"` : '';
        html += `<${bloque.lista}${start}>`;
        listaAbierta = { id: bloque.listaId, tag: bloque.lista };
      }
      html += `<li${continua ? ' class="continua"' : ''}>${contenido}</li>`;
    } else {
      if (listaAbierta) {
        html += `</${listaAbierta.tag}>`;
        listaAbierta = null;
      }
      html += `<p>${contenido}</p>`;
    }
    i = j;
  }
  if (listaAbierta) html += `</${listaAbierta.tag}>`;
  return html;
}

// ---------------------------------------------------------------- medición

/**
 * Corta `html` en páginas que entran en una caja de `anchoPx` × `altoMax`, con
 * la clase tipográfica `clase` (la MISMA de las páginas visibles). Mide en un
 * clon oculto adjunto al body.
 */
export function paginarHtml(html: string, altoMax: number, anchoPx: number, clase: string): string[] {
  if (typeof document === 'undefined' || altoMax <= 0 || anchoPx <= 0) return [html];
  const doc = parsearHtml(html);
  const n = doc.atomos.length;
  if (n === 0) return [''];

  const clon = document.createElement('div');
  clon.className = clase;
  clon.setAttribute('aria-hidden', 'true');
  Object.assign(clon.style, {
    position: 'absolute',
    visibility: 'hidden',
    pointerEvents: 'none',
    top: '0',
    left: '-9999px',
    height: 'auto',
    width: `${anchoPx}px`,
  });
  document.body.appendChild(clon);

  // Medio píxel de tolerancia por redondeo subpíxel de getBoundingClientRect.
  const entra = (desde: number, hasta: number) => {
    clon.innerHTML = armarPagina(doc, desde, hasta);
    return clon.scrollHeight <= altoMax + 0.5;
  };

  const paginas: string[] = [];
  let inicio = 0;
  try {
    while (inicio < n) {
      if (entra(inicio, n)) {
        paginas.push(armarPagina(doc, inicio, n));
        break;
      }
      // Máximo `hasta` que entra (al menos una palabra, para no trabarse con
      // una palabra suelta más ancha/alta que la caja entera).
      let lo = inicio + 1;
      let hi = n - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (entra(inicio, mid)) lo = mid;
        else hi = mid - 1;
      }
      let corte = lo;

      // Ítem de lista cortado: si él solo entra en una página, pasa entero a
      // la siguiente (siempre que no sea lo primero de esta página).
      const b = doc.atomos[corte].bloque;
      if (
        doc.atomos[corte - 1].bloque === b &&
        doc.bloques[b].tipo === 'li' &&
        doc.primero[b] > inicio &&
        entra(doc.primero[b], doc.ultimo[b] + 1)
      ) {
        corte = doc.primero[b];
      }

      paginas.push(armarPagina(doc, inicio, corte));
      inicio = corte;
    }
  } finally {
    document.body.removeChild(clon);
  }
  return paginas;
}
