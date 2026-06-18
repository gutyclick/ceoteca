# Ceoteca — Guía editorial y de contenido

## 1. Objetivo

El contenido de Ceoteca debe ayudar al usuario a:

- Entender.
- Recordar.
- Reflexionar.
- Aplicar.
- Tomar acción.

No debe limitarse a resumir párrafos.

## 2. Principios editoriales

- Redacción original.
- Lenguaje claro.
- Español neutro.
- Frases directas.
- Ejemplos aplicables a Latinoamérica.
- Sin promesas exageradas.
- Sin atribuciones falsas.
- Diferenciar hechos, interpretaciones y recomendaciones.
- Evitar consejo profesional cuando corresponda.

## 3. Prohibiciones

No:

- Copiar capítulos.
- Parafrasear demasiado cerca del original.
- Usar portadas oficiales.
- Inventar citas.
- Inventar números de página.
- Afirmar que el autor dijo algo sin fuente verificada.
- Presentar la conclusión de Ceoteca como conclusión del autor.
- Presentar contenido demo como contenido editorial final.

## 4. Estructura de análisis

Cada libro puede contener:

1. Introducción.
2. Contexto.
3. Idea central.
4. Ideas principales.
5. Ejemplos originales.
6. Actividades.
7. Escenarios.
8. Reflexión.
9. Aplicación práctica.
10. Limitaciones.
11. Conclusión editorial.
12. Próximo paso.

## 5. Puntos clave

Cada punto clave debe incluir:

- Número.
- Título corto.
- Explicación original.
- Ejemplo.
- Acción recomendada.
- Posible limitación.

## 6. Actividades

Tipos permitidos:

- Pregunta de reflexión.
- Checklist.
- Selección múltiple.
- Ordenar prioridades.
- Escenario práctico.
- Plan de 7 días.
- Compromiso de acción.
- Autoevaluación.

Las actividades deben:

- Tener una finalidad clara.
- Ser breves.
- Evitar respuestas “correctas” cuando el tema sea subjetivo.
- Guardar progreso cuando sea posible.

## 7. Citas

Regla por defecto:

- No incluir citas textuales en contenido demo.
- Usar paráfrasis claramente marcadas.
- Solo añadir una cita real cuando haya sido verificada editorialmente.
- Guardar fuente interna de verificación.
- No permitir que la IA invente citas.

Formato de paráfrasis:

> Idea parafraseada por Ceoteca, no cita textual.

## 8. Disclaimer

Mostrar en cada libro:

> Contenido educativo y editorial propio. Ceoteca no está afiliada al autor ni a la editorial. Este análisis no reemplaza la obra original.

## 9. Enlace al original

Campo:

```ts
purchaseUrl?: string
```

Texto sugerido:

> Comprar el libro original

No afirmar afiliación salvo que exista.

## 10. Chat editorial

El chat recibe:

- Análisis autorizado.
- Puntos clave.
- Actividades.
- Conclusión editorial.
- Metadatos básicos.

No debe recibir:

- Texto completo del libro.
- Contenido no autorizado.
- Citas no verificadas.

## 11. Contenido demo

Debe estar marcado internamente:

```ts
isDemoContent: true
```

Los testimonios demo deben declararse representativos, no verificados.

Las métricas demo deben estar centralizadas para reemplazo posterior.
