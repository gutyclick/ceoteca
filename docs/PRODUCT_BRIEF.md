# Ceoteca — Brief de producto

## 1. Visión

Ceoteca es una plataforma web en español que transforma libros de finanzas, hábitos, productividad, emprendimiento y desarrollo personal en experiencias de aprendizaje interactivas, accesibles y accionables.

La plataforma combina:

- Análisis editoriales propios.
- Actividades prácticas.
- Audio.
- Seguimiento de progreso.
- Chat con IA contextual por libro.

## 2. Propuesta de valor

> Aprende las mejores ideas del mundo en 15 minutos.

Versión extendida:

> Entiende más en 15 minutos de lo que leerías en cientos de páginas y pregúntale al análisis lo que necesitas saber.

## 3. Problemas que resuelve

### Falta de tiempo

Muchas personas comienzan libros pero no los terminan. El formato largo no siempre se adapta a la vida diaria.

### Falta de comprensión

Leer no garantiza entender ni recordar. Ceoteca estructura las ideas y añade ejercicios.

### Falta de aplicación

El usuario necesita adaptar los conceptos a su contexto personal.

### Oferta limitada en español

Gran parte de las plataformas de resúmenes y aprendizaje priorizan contenido en inglés.

## 4. Usuario objetivo

- Edad principal: 25 a 45 años.
- Empleados, emprendedores, freelancers y universitarios.
- Hispanohablantes de Latinoamérica, España y Estados Unidos.
- Usuarios acostumbrados a productos digitales por suscripción.
- Interesados en finanzas, hábitos, productividad, negocios y desarrollo personal.
- Personas que quieren aprender de libros pero tienen poco tiempo.

## 5. Tipos de usuario

### Explorador

- Plan Gratis.
- Evalúa el producto.
- Accede a 3 libros.
- Sin audio ni chat.

### Aprendiz activo

- Plan Pro.
- Consume análisis regularmente.
- Usa audio y chat.
- Límite de 50 preguntas mensuales.

### Power user

- Plan Ilimitado.
- Consume varios libros por semana.
- Chat sujeto a políticas de uso razonable.
- Acceso anticipado.

### Fundador

- Oferta limitada.
- Pago inicial de entrada.
- Tarifa mensual protegida mientras mantenga la suscripción.
- Beneficios equivalentes a Pro y badge especial.

## 6. Sitio público

### Landing `/`

Debe contener:

- Hero.
- Propuesta de valor.
- CTA “Empieza gratis”.
- Cómo funciona.
- Vista previa de libros.
- Comparativa.
- Testimonios demo.
- Estadísticas demo.
- FAQ.
- CTA final.

### Pricing `/pricing`

- Toggle mensual/anual.
- Gratis.
- Pro.
- Ilimitado.
- Fundador opcional.
- Comparativa de funciones.
- CTA por plan.

### Biblioteca pública `/biblioteca`

- Exploración parcial.
- Búsqueda y filtros.
- Vista previa.
- Bloqueo del contenido completo.
- CTA de registro.

### Auth

- `/registro`
- `/login`
- Email y contraseña.
- Google OAuth preparado.
- Baja fricción.
- Redirección según el plan seleccionado.

## 7. Web app

### Home `/home`

Experiencia de catálogo estilo streaming:

- Bienvenida personalizada.
- Libro destacado.
- Continúa aprendiendo.
- Más populares.
- Finanzas personales.
- Hábitos y productividad.
- Emprendimiento.
- Psicología.
- Recomendados.
- Buscador por título, autor, categoría y etiquetas.

### Libro `/libro/[slug]`

- Portada conceptual propia.
- Título, autor y categoría.
- Duración estimada.
- Dificultad.
- Tags.
- Progreso.
- Audio.
- Análisis interactivo.
- Actividades.
- Puntos clave.
- Conclusión editorial.
- Disclaimer.
- Enlace de compra del libro original.
- Chat “Habla con este libro”.

### Perfil `/perfil`

- Datos personales.
- Plan.
- Uso mensual.
- Historial.
- Libros iniciados y completados.
- Gestión de cuenta.
- Gestión de suscripción.

### Planes `/planes`

- Plan actual.
- Comparativa.
- Upgrade.
- Downgrade.
- Cancelación.
- Facturación.
- Integración de pagos inicialmente simulada.

## 8. Chat con IA

La IA debe responder solo con base en el contenido editorial autorizado de Ceoteca para el libro activo.

Reglas:

- Responder siempre en español.
- No inventar páginas, capítulos o citas.
- No utilizar información externa cuando el modo estricto esté activo.
- Rechazar preguntas no relacionadas.
- Aplicar las ideas al contexto del usuario.
- Verificar plan y consumo mensual en servidor.

Respuesta de rechazo sugerida:

> Solo puedo ayudarte con ideas relacionadas con este análisis de Ceoteca.

## 9. Planes

### Gratis

- 3 libros.
- Sin audio.
- Sin chat.
- Vista previa de biblioteca.

### Pro

- Todos los libros publicados.
- Audio.
- 50 preguntas de chat por mes.
- Actividades.
- Historial.

Precio inicial de referencia:

- USD 7.99/mes.

### Ilimitado

- Todo Pro.
- Chat sujeto a uso razonable.
- Acceso anticipado.
- Funciones premium futuras.

Precio inicial de referencia:

- USD 14.99/mes.

### Fundador

- Entrada inicial de USD 20.
- USD 4.99/mes.
- Precio protegido mientras la suscripción permanezca activa.
- Límite de 100 usuarios.
- Audio y 50 preguntas de chat al mes.

Todos los precios deben estar centralizados en configuración y poder cambiar sin editar componentes.

## 10. Catálogo inicial

Datos demo iniciales:

1. Hábitos Atómicos — James Clear.
2. Padre Rico, Padre Pobre — Robert Kiyosaki.
3. La Startup de $100 — Chris Guillebeau.
4. El Hombre Más Rico de Babilonia — George S. Clason.
5. Pensar Rápido, Pensar Despacio — Daniel Kahneman.
6. El Poder del Ahora — Eckhart Tolle.
7. Cómo Ganar Amigos e Influir Sobre las Personas — Dale Carnegie.
8. La Semana Laboral de 4 Horas — Tim Ferriss.
9. Mindset — Carol S. Dweck.
10. El Inversor Inteligente — Benjamin Graham.

Estos registros deben incluir únicamente metadatos y contenido editorial demo original.

## 11. Métricas demo

La landing puede mostrar, marcadas internamente como datos demo:

- +500 libros analizados.
- +25,000 lectores activos.
- 12 minutos de lectura promedio.
- 4.9/5 de valoración.

No presentar estas métricas como datos auditados hasta contar con información real.

## 12. Requisitos legales de producto

- Contenido editorial propio.
- Portadas conceptuales no oficiales.
- Sin transcripciones.
- Sin capítulos reproducidos.
- Sin citas inventadas.
- Disclaimer visible.
- Enlace opcional a la obra original.
- Términos y privacidad antes del lanzamiento.
- Revisión legal profesional antes de operar comercialmente.

## 13. Objetivo del MVP

El MVP debe demostrar:

- Calidad visual.
- Navegación completa.
- Biblioteca atractiva.
- Página de libro diferenciada.
- Actividades interactivas.
- Bloqueos por plan.
- Chat contextual.
- Flujo de registro.
- Preparación para pagos.
- Funcionamiento demo sin credenciales.
