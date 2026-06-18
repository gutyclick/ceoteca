# Ceoteca — Cómo usar esta documentación con Codex

## 1. Copia los archivos

Coloca:

```text
AGENTS.md
docs/
```

en la raíz del repositorio.

Añade también la imagen de referencia como:

```text
docs/reference-home.png
```

## 2. No pegues el prompt maestro completo

Codex debe leer:

- `AGENTS.md`
- El documento específico de la tarea.
- `docs/ROADMAP.md`

Después recibe un prompt corto.

## 3. Primer mensaje recomendado

```text
Lee `AGENTS.md` y los documentos de `/docs`.

Inspecciona el repositorio y crea un plan por fases basado en
`docs/ROADMAP.md`.

No escribas código todavía.
```

## 4. Ejecución por fases

Usa los prompts de:

```text
docs/CODEX_PROMPTS.md
```

Ejecuta una fase por conversación o por tarea.

## 5. Regla de cierre

Añade siempre:

```text
No avances a la siguiente fase.
No modifiques archivos fuera del alcance salvo que sea imprescindible.
Ejecuta lint, typecheck y build.
Corrige todos los errores antes de terminar.
```

## 6. Archivos que debes personalizar

Antes de producción revisa:

- Precios.
- Métricas.
- Términos.
- Privacidad.
- Proveedor de pagos.
- Modelos de OpenAI.
- Políticas de uso razonable.
- Contenido editorial.
- Enlaces de compra.
- Datos de contacto.
