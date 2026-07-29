# Paleta y tipografías — Portfolio Salomón Barrios

Valores extraídos del archivo de InDesign original del artista.
Este archivo es la fuente de verdad para colores y tipografía.
No sustituir nada por criterio propio.

---

## Colores

Las tres primeras salen de las muestras HSB del panel de Swatches de
InDesign, convertidas a HEX.

| Nombre | HEX | Origen | Uso |
|---|---|---|---|
| `tinta` | `#000014` | HSB 240 / 98 / 8 | Casi negro con tinte azul. Textos sobre fondo claro, velo del hero. |
| `navbar` | `#2A2A36` | HSB 240 / 21 / 21 | Azul grisáceo oscuro. Barra del navbar cuando se vuelve sólida. |
| `claro` | `#F7F6F2` | HSB 40 / 2 / 97 | Blanco roto casi neutro. Texto sobre fondo oscuro. |
| `papel` | `#F4F1E4` | Muestreado de la textura | Crema cálido. Fondo de respaldo detrás de `textura-papel.jpg`. |

**La paleta es exactamente esta y no hay color de acento.** El diseño se
apoya enteramente en la textura de papel como fondo de toda la página, y
el contraste sale de los tonos oscuros contra el crema. No agregar
acentos de color propios.

Si en el PDF aparece algo que parece un dorado o un marrón suelto (por
ejemplo en parte del número de teléfono), son las fibras marrones de la
textura del papel asomando detrás del texto, no un color aplicado.

### Nota sobre `claro` y `papel`

Son dos cosas distintas y no hay que confundirlas. `claro` (`#F7F6F2`) es
prácticamente neutro y se usa para **texto** sobre las zonas oscuras.
`papel` (`#F4F1E4`) es más cálido y amarillento, y es el **fondo** de las
secciones claras, detrás de la textura.

Si se usa `claro` como fondo de sección, va a chocar con la textura de
papel y se va a ver un corte de temperatura.

---

## Tipografías

Cuatro roles. Dos vienen de Google Fonts, dos hay que alojarlas.

### Display — Sekuya

- Origen: Google Fonts, licencia OFL, libre para uso comercial.
- Un solo peso (400). Solo mayúsculas.
- Uso exclusivo: el título grande `SALOMÓN BARRIOS` del hero.
- **Verificar que la Ó renderice.** La cobertura de caracteres es acotada.
  Si el glifo falta, avisar antes de sustituir.

### Mono — Cousine (en reemplazo de Courier New)

- Origen: Google Fonts, licencia Apache.
- Stack: `Cousine, "Courier New", Courier, monospace`
- Uso: items del navbar (bold), subtítulo del hero, encabezado
  `DECLARACIÓN DEL ARTISTA`, texto del hero, títulos sobre las obras.
- **El diseño original usa Courier New**, pero su licencia no permite
  embeberla como webfont. Cousine es métricamente compatible y renderiza
  igual en todos los sistemas. No embeber Courier New.

### Subtítulos — PS Pimpdeed

- Origen: f0nt.com, autor "touchie". Familia de máquina de escribir.
- Self-hosted. Archivo `.ttf` disponible en la carpeta `Document Fonts`
  del Package de InDesign.
- Uso: etiquetas de sección `bio.1`, `work.2`, `CV.3`, `Contactame.4`

### Cuerpo — PS Pimpdeed II

- Mismo origen y misma familia.
- Uso: texto largo de las secciones claras (bio, CV).

### Conversión de las dos self-hosted

Los `.ttf` originales pesan más de 500 KB porque cargan tailandés, lao,
cirílico y griego además del latín. Hay que subsetear:

```bash
pip install fonttools brotli

pyftsubset PSPimpdeed.ttf \
  --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC" \
  --flavor=woff2 --output-file=PSPimpdeed.woff2
```

Deberían quedar en 30 o 40 KB cada una. Van a `public/fonts/`.

Cubren Latin-1 Supplement y Latin Extended-A, así que los acentos y la ñ
del español funcionan bien.

---

## Efectos

### Overlay de los bordes ornamentales

En InDesign el patrón decorativo de los márgenes izquierdo y derecho está
aplicado con modo de fusión **Overlay al 75% de opacidad**.

En CSS: `mix-blend-mode: overlay; opacity: 0.75;`

Los modos de fusión de CSS no dan un resultado idéntico a los de InDesign.
Probablemente haya que ajustar la opacidad a ojo hasta que matchee el PDF.

### Textura de papel

Archivo: `referencia/textura-papel.jpg`

**No es repetible sin costuras.** Usarla como capa `position: fixed`
detrás del contenido con `background-size: cover`, comprimida a WebP.

- No usar `background-repeat`: se ven las junturas.
- No usar `background-attachment: fixed`: se comporta mal en iOS Safari.

Como la textura es sutil, tolera compresión agresiva (calidad 60) sin que
se note. Debería quedar por debajo de 150 KB.

---

## Pendientes sin resolver

1. **El patrón ornamental de los márgenes.** Falta el asset. Se necesita
   en PNG con transparencia, o SVG si es vectorial. Sin él no se pueden
   replicar los bordes de la página.

2. **El borde ondulado del hero.** No hay SVG original. Se reconstruye
   como path a partir del PDF. Va a quedar aproximado. Cuando el artista
   lo exporte, es reemplazar el atributo `d` del path.
