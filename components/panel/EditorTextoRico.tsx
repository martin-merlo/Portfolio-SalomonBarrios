'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { ListItem } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { normalizarContenido } from '@/lib/textoRico';

/**
 * Editor de texto enriquecido (Tiptap) para los bloques de texto de obra.
 *
 * Formato deliberadamente mínimo — negrita, cursiva, lista con viñetas, lista
 * numerada y link — y NADA más: el resto de lo que trae StarterKit
 * (encabezados, citas, código, tachado, subrayado, línea horizontal) queda
 * desactivado, así tampoco entra por atajos de teclado, por la sintaxis tipo
 * markdown ("# ", "> "…) ni al pegar contenido de otro lado. Sin imagen ni
 * video: eso ya lo resuelven los bloques de imagen/video.
 *
 * Listas SIN anidar (sin Tab para meter un ítem dentro de otro, y un ítem
 * sólo admite párrafos): el CV y la declaración se paginan midiendo el alto
 * del contenido, y las listas anidadas no son parte de los 5 botones.
 *
 * Devuelve HTML (getHTML()); un editor vacío da null. Dos formas de uso:
 *   - onGuardar: se llama al perder el foco (bloques de obra, que persisten
 *     cada campo al toque, igual que el textarea anterior).
 *   - onCambio: se llama en cada cambio (form de contenido, que guarda todo
 *     junto con su botón "Guardar").
 * El contenido existente se carga normalizado: el texto plano viejo se
 * convierte a párrafos (ver lib/textoRico.ts). Lo guardado se vuelve a
 * sanitizar al renderizar.
 */
export default function EditorTextoRico({
  valorInicial,
  onGuardar,
  onCambio,
  etiqueta = 'Texto del bloque',
  placeholder = 'Texto del bloque…',
  altoMinimo = 'min-h-[6rem]',
}: {
  valorInicial: string | null;
  onGuardar?: (html: string | null) => void;
  onCambio?: (html: string | null) => void;
  etiqueta?: string;
  placeholder?: string;
  altoMinimo?: string;
}) {
  // El editor se crea una vez; los callbacks más recientes se leen por ref.
  const onGuardarRef = useRef(onGuardar);
  const onCambioRef = useRef(onCambio);
  useEffect(() => {
    onGuardarRef.current = onGuardar;
    onCambioRef.current = onCambio;
  }, [onGuardar, onCambio]);

  const editor = useEditor({
    // Next renderiza el panel en el servidor: sin esto Tiptap intenta montar
    // el editor durante el SSR y da error de hidratación.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        listItem: false, // reemplazado por ListaSinAnidar
        // Sin el <p></p> vacío que TrailingNode agrega siempre al final.
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          // target/rel no se guardan: los decide el render según el link
          // (externo → pestaña nueva + noopener noreferrer).
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      ListaSinAnidar,
      Placeholder.configure({ placeholder }),
    ],
    content: normalizarContenido(valorInicial),
    editorProps: {
      attributes: {
        class: `texto-rico ${altoMinimo} px-3 py-2 text-sm text-slate-800 leading-relaxed focus:outline-none`,
        'aria-label': etiqueta,
      },
    },
    onBlur: ({ editor }) => guardar(editor),
    onUpdate: ({ editor }) => onCambioRef.current?.(valor(editor)),
  });

  function valor(ed: Editor): string | null {
    return ed.isEmpty ? null : ed.getHTML();
  }

  function guardar(ed: Editor) {
    onGuardarRef.current?.(valor(ed));
  }

  const estado = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      negrita: ed?.isActive('bold') ?? false,
      cursiva: ed?.isActive('italic') ?? false,
      vinetas: ed?.isActive('bulletList') ?? false,
      numerada: ed?.isActive('orderedList') ?? false,
      link: ed?.isActive('link') ?? false,
    }),
  });

  function editarLink() {
    if (!editor) return;
    const previo = (editor.getAttributes('link').href as string | undefined) ?? '';
    const ingresado = window.prompt('Dirección del link (dejalo vacío para quitarlo):', previo);
    if (ingresado === null) return; // canceló
    const url = ingresado.trim();

    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Sin protocolo ("salomon.com") se asume https. mailto: y rutas del
      // propio sitio (/obra/…) quedan como están.
      const href = /^(https?:\/\/|mailto:|\/)/i.test(url) ? url : `https://${url}`;
      const { empty } = editor.state.selection;
      if (empty && !editor.isActive('link')) {
        // Sin texto seleccionado: inserta la dirección misma como link.
        editor
          .chain()
          .focus()
          .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
          .run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
      }
    }
    // El prompt le saca el foco al editor (y el blur ya guardó ANTES del
    // cambio): se guarda de nuevo con el link aplicado.
    guardar(editor);
  }

  return (
    <div className="editor-panel rounded border border-slate-300 bg-white focus-within:border-slate-500">
      <div
        role="toolbar"
        aria-label="Formato del texto"
        className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-1.5 py-1"
      >
        <BotonFormato
          etiqueta="Negrita"
          activo={estado?.negrita}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </BotonFormato>
        <BotonFormato
          etiqueta="Cursiva"
          activo={estado?.cursiva}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span className="italic font-serif">I</span>
        </BotonFormato>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />
        <BotonFormato
          etiqueta="Lista con viñetas"
          activo={estado?.vinetas}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <IconoLista numerada={false} />
        </BotonFormato>
        <BotonFormato
          etiqueta="Lista numerada"
          activo={estado?.numerada}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <IconoLista numerada />
        </BotonFormato>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />
        <BotonFormato
          etiqueta={estado?.link ? 'Editar link' : 'Insertar link'}
          activo={estado?.link}
          onClick={editarLink}
        >
          <IconoLink />
        </BotonFormato>
        {estado?.link && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (!editor) return;
              editor.chain().focus().extendMarkRange('link').unsetLink().run();
              guardar(editor);
            }}
            className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Quitar link
          </button>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Ítem de lista sin anidamiento: sólo párrafos adentro (una lista pegada
 * dentro de otra se aplana) y sin el atajo Tab que mete un ítem dentro del
 * anterior. Enter / Shift+Tab siguen como siempre.
 */
const ListaSinAnidar = ListItem.extend({
  content: 'paragraph+',
  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem(this.name),
      'Shift-Tab': () => this.editor.commands.liftListItem(this.name),
    };
  },
});

function BotonFormato({
  etiqueta,
  activo,
  onClick,
  children,
}: {
  etiqueta: string;
  activo?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={etiqueta}
      aria-label={etiqueta}
      aria-pressed={!!activo}
      // preventDefault en mousedown: el editor no pierde el foco (ni la
      // selección) al tocar un botón de la barra.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-sm transition-colors ${
        activo ? 'bg-slate-800 text-white' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function IconoLista({ numerada }: { numerada: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {numerada ? (
        <>
          <text x="1" y="7" fontSize="6" fill="currentColor" stroke="none">1</text>
          <text x="1" y="13.5" fontSize="6" fill="currentColor" stroke="none">2</text>
          <text x="1" y="19.5" fontSize="6" fill="currentColor" stroke="none">3</text>
        </>
      ) : (
        <>
          <circle cx="3" cy="5" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="10" r="1.2" fill="currentColor" stroke="none" />
          <circle cx="3" cy="15" r="1.2" fill="currentColor" stroke="none" />
        </>
      )}
      <path d="M7 5h11M7 10h11M7 15h11" strokeLinecap="round" />
    </svg>
  );
}

function IconoLink() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L10 5" />
      <path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1" />
    </svg>
  );
}
