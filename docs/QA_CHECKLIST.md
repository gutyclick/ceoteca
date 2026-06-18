# Ceoteca — Checklist de QA

## 1. Build y calidad

- [ ] `npm install` funciona.
- [ ] `npm run dev` funciona.
- [ ] `npm run lint` pasa.
- [ ] `npm run typecheck` pasa.
- [ ] `npm run build` pasa.
- [ ] No hay errores importantes en consola.
- [ ] No hay imports sin usar.
- [ ] No hay `any` sin justificación.
- [ ] No hay secretos en cliente.

## 2. Responsive

Validar en:

- [ ] 360 px.
- [ ] 390 px.
- [ ] 768 px.
- [ ] 1024 px.
- [ ] 1280 px.
- [ ] 1440 px.

Comprobar:

- [ ] Sin overflow horizontal.
- [ ] Menú móvil.
- [ ] Botones táctiles.
- [ ] Texto legible.
- [ ] Carruseles touch.
- [ ] Pricing usable.
- [ ] Chat usable.
- [ ] Audio player usable.
- [ ] Hero no se rompe.

## 3. Navegación

- [ ] Header.
- [ ] Footer.
- [ ] CTA hero.
- [ ] Pricing.
- [ ] Registro.
- [ ] Login.
- [ ] Biblioteca.
- [ ] Home.
- [ ] Libro.
- [ ] Perfil.
- [ ] Planes.
- [ ] Términos.
- [ ] Privacidad.
- [ ] 404.

## 4. Accesibilidad

- [ ] HTML semántico.
- [ ] Labels.
- [ ] Focus visible.
- [ ] Navegación por teclado.
- [ ] Menú móvil accesible.
- [ ] FAQ con `aria-expanded`.
- [ ] Modales con focus trap.
- [ ] Escape cierra modales.
- [ ] Contraste adecuado.
- [ ] Errores asociados a campos.
- [ ] Reduced motion.
- [ ] Iconos con labels.

## 5. Landing

- [ ] Hero.
- [ ] CTA principal.
- [ ] CTA secundario.
- [ ] Composición de tarjetas.
- [ ] Chat demo.
- [ ] Estadísticas demo.
- [ ] Cómo funciona.
- [ ] Libros.
- [ ] Comparativa.
- [ ] Testimonios demo.
- [ ] FAQ.
- [ ] CTA final.
- [ ] Footer.

## 6. Auth

- [ ] Validación email.
- [ ] Validación contraseña.
- [ ] Confirmación.
- [ ] Términos.
- [ ] Loading.
- [ ] Error.
- [ ] Success.
- [ ] Plan desde query.
- [ ] Redirección.
- [ ] Modo demo.
- [ ] Logout.

## 7. Biblioteca

- [ ] Buscar por título.
- [ ] Buscar por autor.
- [ ] Filtrar categoría.
- [ ] Filtrar tags.
- [ ] Sin resultados.
- [ ] Loading skeleton.
- [ ] Error.
- [ ] Portadas propias.
- [ ] Links correctos.

## 8. Libro

- [ ] Libro inexistente devuelve 404.
- [ ] Metadatos.
- [ ] Portada.
- [ ] Tags.
- [ ] Progreso.
- [ ] Audio.
- [ ] Bloqueo Gratis.
- [ ] Análisis.
- [ ] Actividades.
- [ ] Puntos clave.
- [ ] Conclusión.
- [ ] Disclaimer.
- [ ] Enlace original.
- [ ] Chat.

## 9. Planes y permisos

- [ ] Configuración central.
- [ ] Gratis: 3 libros.
- [ ] Gratis: sin audio.
- [ ] Gratis: sin chat.
- [ ] Pro: audio.
- [ ] Pro: 50 preguntas.
- [ ] Ilimitado: uso razonable.
- [ ] Fundador: badge.
- [ ] Verificación en servidor.
- [ ] UI de upgrade.

## 10. Chat

- [ ] Validación.
- [ ] Sesión.
- [ ] Libro.
- [ ] Plan.
- [ ] Límite.
- [ ] Rate limit.
- [ ] Error.
- [ ] Retry.
- [ ] Mock.
- [ ] OpenAI no expuesto.
- [ ] No inventa citas.
- [ ] Rechaza temas externos.
- [ ] Responde en español.

## 11. Legal y contenido

- [ ] No hay portadas oficiales.
- [ ] No hay texto copiado.
- [ ] No hay citas inventadas.
- [ ] Testimonios demo marcados.
- [ ] Métricas demo centralizadas.
- [ ] Disclaimer por libro.
- [ ] Términos placeholder.
- [ ] Privacidad placeholder.

## 12. SEO

- [ ] Metadata global.
- [ ] Metadata por página.
- [ ] Title.
- [ ] Description.
- [ ] Open Graph.
- [ ] Twitter cards.
- [ ] Sitemap.
- [ ] Robots.
- [ ] Canonical preparado.
- [ ] JSON-LD.
- [ ] Headings correctos.

## 13. Rendimiento

- [ ] `next/image`.
- [ ] Fuentes optimizadas.
- [ ] Lazy loading.
- [ ] Server Components.
- [ ] Dependencias justificadas.
- [ ] Animaciones ligeras.
- [ ] No carga todo el catálogo innecesariamente.
- [ ] Audio no se regenera por reproducción.
