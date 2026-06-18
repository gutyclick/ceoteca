# Ceoteca — Sistema de diseño

## 1. Dirección visual

Ceoteca debe sentirse:

- Premium.
- Moderna.
- Tecnológica.
- Editorial.
- Inmersiva.
- Clara.
- Accesible.

La interfaz utiliza un fondo oscuro con iluminación ambiental y gradientes controlados.

La referencia visual del proyecto debe interpretarse como dirección artística, no como plantilla para copiar.

## 2. Paleta

### Fondos

```css
--background: #05050a;
--background-soft: #080811;
--surface: #0b0b14;
--surface-raised: #11111e;
--surface-hover: #171727;
```

### Texto

```css
--text-primary: #f7f7fa;
--text-secondary: #a7a7b5;
--text-muted: #737386;
--text-inverse: #09090f;
```

### Marca

```css
--brand-blue: #4f63ff;
--brand-violet: #7c3aed;
--brand-purple: #a855f7;
--brand-pink: #ec4899;
```

### Estados

```css
--success: #22c55e;
--warning: #f59e0b;
--danger: #ef4444;
--info: #38bdf8;
```

## 3. Gradientes

### Principal

```css
linear-gradient(135deg, #4f63ff 0%, #8b5cf6 50%, #ec4899 100%)
```

### Glow violeta

```css
radial-gradient(circle, rgba(124, 58, 237, 0.3), transparent 70%)
```

### Glow rosa

```css
radial-gradient(circle, rgba(236, 72, 153, 0.22), transparent 70%)
```

### Superficie

```css
linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))
```

## 4. Tipografía

Usar Geist mediante `next/font`.

Fallback:

```css
font-family: Geist, Inter, ui-sans-serif, system-ui, sans-serif;
```

Escala sugerida:

- Display XL: 72–88 px desktop.
- Display L: 56–72 px desktop.
- H1: 48–64 px.
- H2: 36–48 px.
- H3: 24–32 px.
- Body L: 18–20 px.
- Body: 16 px.
- Small: 14 px.
- Caption: 12 px.

En móvil usar `clamp()` para reducir escalas.

## 5. Espaciado

Escala base de 4 px:

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48
- 64
- 80
- 96
- 128

Contenedor principal:

```css
max-width: 1280px;
padding-inline: clamp(20px, 4vw, 48px);
```

Separación vertical de secciones:

```css
padding-block: clamp(72px, 10vw, 144px);
```

## 6. Bordes y radios

- Botón pequeño: 12 px.
- Botón principal: 14–16 px.
- Tarjeta: 20–28 px.
- Modal: 24 px.
- Pills: 999 px.

Borde estándar:

```css
border: 1px solid rgba(255,255,255,0.1);
```

Borde activo:

```css
border: 1px solid rgba(168,85,247,0.7);
```

## 7. Sombras

Usar sombras suaves, no opacas.

```css
box-shadow:
  0 24px 80px rgba(0,0,0,0.45),
  0 0 60px rgba(124,58,237,0.14);
```

## 8. Botones

### Primario

- Fondo con gradiente de marca.
- Texto blanco.
- Altura mínima 48 px.
- Hover con incremento sutil de brillo.
- Focus ring visible.
- Disabled con opacidad y cursor apropiado.

### Secundario

- Fondo transparente o superficie.
- Borde tenue.
- Hover con fondo ligeramente más claro.

### Texto

- Sin fondo.
- Color secundario.
- Hover a blanco.

## 9. Tarjetas

Todas las tarjetas deben:

- Tener contraste suficiente.
- Usar bordes discretos.
- Evitar exceso de blur.
- Mantener jerarquía clara.
- Contener estados hover únicamente cuando sean interactivas.

Variantes:

- Book card.
- Pricing card.
- Feature card.
- Testimonial card.
- Stat card.
- Chat card.
- Exercise card.

## 10. Portadas conceptuales

No usar portadas oficiales.

Cada portada puede generarse mediante:

- Fondo con gradiente.
- Formas geométricas.
- Icono abstracto.
- Categoría.
- Título.
- Autor.
- Patrón visual.
- Configuración en JSON.

Campos sugeridos:

```ts
type CoverConfig = {
  variant: "orb" | "steps" | "bolt" | "growth" | "people" | "grid";
  gradient: string;
  accent: string;
  icon?: string;
};
```

## 11. Logo

Logo provisional:

- Monograma basado en “C”.
- Geométrico.
- Sin icono de libro genérico.
- SVG.
- Gradiente azul/violeta.
- Debe funcionar a 24 px.
- Debe tener versión de icono y versión horizontal.

## 12. Movimiento

Animaciones permitidas:

- Fade y slide leve.
- Hover de 2–4 px.
- Cambio de glow.
- Apertura de acordeón.
- Entrada de modal.
- Movimiento ambiental lento en hero.

Duración recomendada:

- Microinteracción: 150–200 ms.
- Componente: 250–350 ms.
- Ambiental: 6–14 s.

Respetar:

```css
@media (prefers-reduced-motion: reduce)
```

## 13. Responsive

Breakpoints sugeridos:

- 360 px.
- 390 px.
- 640 px.
- 768 px.
- 1024 px.
- 1280 px.
- 1440 px.

Reglas:

- No permitir scroll horizontal accidental.
- Menú móvil accesible.
- Tablas convertidas en cards o scroll controlado.
- Carruseles compatibles con touch.
- Chat como drawer o pantalla completa en móvil.
- Botones táctiles de mínimo 44 px.
- Hero simplificado en móvil.
- Tarjetas de portada con proporción consistente.

## 14. Accesibilidad visual

- Contraste AA como objetivo mínimo.
- Focus visible.
- No comunicar estados solo mediante color.
- Texto secundario legible.
- Iconos con labels cuando no haya texto.
- Estados disabled distinguibles.
- Formularios con label persistente.
