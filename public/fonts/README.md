# Fuentes self-hosted

## Sekuya.woff2 — presente, es la fuente real

El rol Display (`SALOMÓN BARRIOS` en el hero) usa Sekuya de Google Fonts,
pero esta versión de `next/font/google` (Next.js 15.5.22) todavía no
tiene a Sekuya en su registro interno y tira `Unknown font \`Sekuya\``
en build. Como es OFL y de descarga libre, se bajó el `.ttf` real desde
`fonts.gstatic.com`, se subseteó a Latin con `pyftsubset` (mismo comando
que abajo) y se cargó con `next/font/local` en `lib/fonts.ts` en vez de
`next/font/google`. Es la tipografía real, no un placeholder.

Se verificó el glifo `Ó` (Oacute, U+00D3) en el cmap subseteado: **está
presente**. También Á, É, Í, Ú, Ñ y sus minúsculas.

Si en una futura versión de Next.js el registro de `next/font/google`
suma a Sekuya, se puede volver a `next/font/google({..., subsets:
['latin'], weight: '400'})` sin cambiar nada visual.

## PSPimpdeed.woff2 / PSPimpdeedII.woff2 — pendientes, todavía no están

Este proyecto usa además dos fuentes self-hosted que **todavía no están
en este repo**:

- `PSPimpdeed.woff2` — rol "Subtítulos" (etiquetas de sección: `bio.1`,
  `work.2`, `CV.3`, `Contactame.4`)
- `PSPimpdeedII.woff2` — rol "Cuerpo" (texto largo de bio y CV)

Ambas son parte de la familia "PS Pimpdeed" (f0nt.com, autor "touchie").
Los `.ttf` originales están en la carpeta `Document Fonts` del Package de
InDesign del artista y pesan +500 KB porque incluyen tailandés, lao,
cirílico y griego. Hay que subsetearlos antes de traerlos:

```bash
pip install fonttools brotli

pyftsubset PSPimpdeed.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC" \
  --flavor=woff2 --output-file=PSPimpdeed.woff2

pyftsubset PSPimpdeedII.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC" \
  --flavor=woff2 --output-file=PSPimpdeedII.woff2
```

Deberían quedar en 30-40 KB cada una. Una vez subseteadas, copiarlas a
esta carpeta (`public/fonts/`) con esos nombres exactos.

## Por qué no se usó `next/font/local`

`next/font/local` resuelve el archivo en tiempo de build (lee el binario
para calcular métricas) y **rompe el build si el archivo no existe**.
Como estos archivos todavía no existen, las declaraciones viven como
`@font-face` planas en `app/globals.css`, apuntando a estas rutas. Un
`@font-face` con un archivo ausente simplemente no carga en runtime (404
silencioso) y el navegador usa el fallback monoespaciado definido en el
mismo stack — el sitio se ve razonable mientras tanto.

Cuando las dos `.woff2` estén acá, no hace falta tocar el CSS: el
`@font-face` las va a levantar solo. Opcionalmente se puede migrar a
`next/font/local` en ese momento para obtener el ajuste automático de
métricas (`size-adjust`), pero no es obligatorio.
