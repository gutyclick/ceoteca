# Primer paquete editorial de CEOTECA Training

## Alcance

El paquete publica contenido original para **Marketing y marca** y **Ventas y persuasión**. No amplía las otras categorías. Las marcas, conversaciones y casos son ficticios y no se vinculan a libros inexistentes.

## Volumen

| Categoría           | Habilidades | Conceptos | Deterministas | Visuales | Mensajes | Abiertos/builders |
| ------------------- | ----------: | --------: | ------------: | -------: | -------: | ----------------: |
| Marketing y marca   |           5 |        20 |            30 |       10 |        0 |                10 |
| Ventas y persuasión |           5 |        20 |            30 |        0 |       12 |                 8 |

Cada ejercicio conserva objetivo, concepto, nivel cognitivo, dificultad, formato, instrucciones, evaluación, feedback, errores frecuentes, plan, estado y fuente editorial. La duración puede permanecer como metadato interno, pero no se muestra ni determina qué ejercicio recibe el usuario. Los ejercicios abiertos usan una rúbrica de claridad, contexto y empatía, criterio aplicado y siguiente paso.

## Selección de ejercicios

Training no pide al usuario elegir una duración ni intenta completar una cantidad de minutos. El motor selecciona una secuencia variada de hasta seis ejercicios publicados según habilidad, progreso, plan, prerrequisitos y repasos pendientes. Si existen menos ejercicios elegibles, entrega los disponibles sin presentar un error relacionado con el tiempo.

## Rutas

- `Construye una marca fuerte`: diez módulos y cuatro actividades por módulo.
- `Aprende a vender`: diez módulos y cuatro actividades por módulo. El último módulo usa una simulación determinista alternativa mientras los escenarios conversacionales permanecen en borrador.

La progresión avanza desde reconocimiento y comprensión hasta aplicación, análisis, transferencia y síntesis.

### Habilidades publicadas

**Marketing y marca**

- Evaluar coherencia de marca.
- Analizar jerarquía visual.
- Crear propuestas de valor.
- Crear slogans.
- Evaluar anuncios.

**Ventas y persuasión**

- Descubrir necesidades.
- Responder objeciones.
- Defender precio.
- Escribir seguimientos.
- Cerrar con claridad.

## Acceso

- **Free**: diez ejercicios completos, vista previa de ambas categorías y dos actividades del primer módulo de cada ruta.
- **Pro**: contenido estándar, rutas completas, visuales y mensajes.
- **Unlimited**: ejercicios avanzados y acceso futuro a role-play avanzado.

Los cuatro escenarios de ventas tienen `status=draft`, `is_active=false` y `minimum_plan=pro`. Las cuotas y permisos se validan en servidor mediante la infraestructura de role-play existente.

## Recursos y semillas

Los diez PNG de `public/images/training/mvp` se generan con `scripts/generate-training-mvp-assets.ps1`. Son composiciones originales con marcas ficticias, texto alternativo y `copyright_status=approved`.

Las migraciones `0037` a `0042` usan UUIDs deterministas, upserts y correcciones idempotentes. Pueden ejecutarse más de una vez sin crear copias. El contenido de pruebas permanece en archivos de test y no se inserta en producción.

En producción, `NEXT_PUBLIC_TRAINING_DATA_SOURCE` debe usar el valor `supabase`. El modo `mock` queda disponible únicamente como fallback de desarrollo.

## Verificación editorial

Antes de publicar cambios futuros, revisar:

1. Que cada ejercicio tenga habilidad y concepto publicados.
2. Que la evaluación determinista tenga respuesta correcta.
3. Que las respuestas abiertas tengan rúbrica completa.
4. Que todo asset visual esté aprobado y tenga texto alternativo.
5. Que cada módulo tenga entre tres y seis actividades.
6. Que Free conserve contenido utilizable y nunca acceda a role-play.
7. Que los tipos usados existan en `ExerciseRenderer`.

La validación completa se ejecuta contra Supabase con:

```bash
npm run validate:training-mvp
```

Comprueba volúmenes, slugs oficiales, metadata editorial, evaluaciones, rúbricas, assets, duplicados, progresión, rutas y permisos por plan.

## QA de interfaz

Se verificaron con una cuenta temporal Pro, eliminada al terminar:

- Las dos páginas de categoría.
- Las habilidades `crear-propuestas-de-valor` y `responder-objeciones`.
- Las rutas `construye-una-marca-fuerte` y `aprende-a-vender`.
- Escritorio de 1440 px y móvil de 390 px.
- Ausencia de overflow horizontal e imágenes rotas.
