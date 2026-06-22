do $$
declare
  target_book_id uuid;
begin
  insert into public.books (
    slug,
    title,
    author,
    category,
    description,
    cover_config,
    reading_time,
    difficulty,
    tags,
    purchase_url,
    is_published
  )
  values (
    'disciplined-entrepreneurship',
    'Disciplined Entrepreneurship',
    'Bill Aulet',
    'Emprendimiento',
    'La metodología del MIT para convertir una idea de startup en un proceso disciplinado de mercado, cliente, valor, producto y validación.',
    '{"variant":"growth","gradient":"from-indigo-400 via-brand-purple to-brand-pink","accent":"text-brand-purple"}'::jsonb,
    10,
    'Intermedio',
    array['startup', 'validación', 'cliente', 'innovación', 'modelo de negocio', 'MIT'],
    'https://www.wiley.com/en-us/Disciplined+Entrepreneurship%3A+24+Steps+to+a+Successful+Startup-p-9781118692288',
    true
  )
  on conflict (slug) do update set
    title = excluded.title,
    author = excluded.author,
    category = excluded.category,
    description = excluded.description,
    cover_config = excluded.cover_config,
    reading_time = excluded.reading_time,
    difficulty = excluded.difficulty,
    tags = excluded.tags,
    purchase_url = excluded.purchase_url,
    is_published = excluded.is_published
  returning id into target_book_id;

  delete from public.book_sections where book_id = target_book_id;

  insert into public.book_sections (book_id, section_type, title, content, position)
  values
    (
      target_book_id,
      'analysis',
      'El emprendimiento como proceso aprendible',
      jsonb_build_object(
        'content',
        'Disciplined Entrepreneurship parte de una idea poderosa: emprender no depende solo de intuición o carisma. Puede enseñarse como una serie de habilidades observables: elegir un mercado, entender al cliente, cuantificar valor, diseñar adquisición, validar supuestos y construir un producto que pueda convertirse en negocio.'
      ),
      1
    ),
    (
      target_book_id,
      'analysis',
      'Innovación exige invención y comercialización',
      jsonb_build_object(
        'content',
        'El análisis resume la fórmula central del libro: una invención sin comercialización no crea impacto, y una buena comercialización sin una propuesta diferencial tampoco sostiene una ventaja. El aprendizaje práctico está en dejar de preguntar solo qué queremos construir y empezar a preguntar quién pagaría, por qué, cuánto valor recibe y cómo llegamos a esa persona.'
      ),
      2
    ),
    (
      target_book_id,
      'analysis',
      'No todo emprendimiento funciona igual',
      jsonb_build_object(
        'content',
        'El libro distingue entre pequeñas y medianas empresas enfocadas en independencia, mercados locales y crecimiento lineal, y empresas impulsadas por innovación que buscan escala, mercados amplios, capital externo y ventajas difíciles de copiar.'
      ),
      3
    ),
    (
      target_book_id,
      'analysis',
      'Los 24 pasos como sistema iterativo',
      jsonb_build_object(
        'content',
        'Los pasos se agrupan en seis preguntas: quién es el cliente, qué puedes hacer por él, cómo lo adquieres, si el negocio es rentable, qué debes construir y cómo pruebas que funciona en el mercado real. Aunque la secuencia importa, cada aprendizaje puede obligarte a volver y mejorar una respuesta anterior.'
      ),
      4
    ),
    (
      target_book_id,
      'analysis',
      'Aplicación Ceoteca',
      jsonb_build_object(
        'content',
        'Este análisis convierte el framework en acciones concretas: definir un beachhead market, elegir un Persona real, cuantificar el valor, mapear ventas, estimar LTV y COCA, declarar la ventaja central, diseñar el MVBP y probar el supuesto más riesgoso antes de escalar.'
      ),
      5
    ),
    (
      target_book_id,
      'key_point',
      'Elige un mercado de entrada',
      jsonb_build_object(
        'number', 1,
        'explanation', 'Intentar servir a todos desde el inicio diluye el mensaje, el producto y los canales. El beachhead market es el primer segmento donde puedes concentrarte hasta aprender, vender y dominar una necesidad específica.',
        'example', 'En vez de vender software de logística a cualquier empresa, empiezas con gerentes de logística de pymes manufactureras de una región concreta.',
        'action', 'Define un segmento con dolor similar, canal de venta identificable y clientes que puedan recomendarte entre sí.',
        'limitation', 'Un mercado pequeño ayuda a enfocar, pero debe ser suficiente para validar un negocio real y abrir mercados posteriores.'
      ),
      6
    ),
    (
      target_book_id,
      'key_point',
      'Convierte el cliente ideal en una persona real',
      jsonb_build_object(
        'number', 2,
        'explanation', 'Un perfil genérico permite discusiones interminables. Un Persona real obliga a observar comportamientos concretos, prioridades, restricciones y decisiones de compra verificables.',
        'example', 'No basta con decir directores financieros. Mejor: una persona específica, con cargo, empresa, problema actual, presupuesto y forma real de resolverlo hoy.',
        'action', 'Elige una persona que puedas entrevistar esta semana y documenta su trabajo, dolor principal, solución actual y costo del problema.',
        'limitation', 'Un solo Persona no representa todo el mercado; sirve como punto de partida para validar patrones con más clientes.'
      ),
      7
    ),
    (
      target_book_id,
      'key_point',
      'Cuantifica la propuesta de valor',
      jsonb_build_object(
        'number', 3,
        'explanation', 'Una propuesta de valor débil usa palabras como rápido, fácil o mejor. Una propuesta fuerte traduce el beneficio a dinero, tiempo, riesgo reducido o ingresos nuevos.',
        'example', 'Ahorrar 8 horas semanales por empleado comunica mejor el valor que decir mejora la productividad del equipo.',
        'action', 'Escribe cuánto gana, ahorra o evita perder tu cliente si tu solución funciona.',
        'limitation', 'La cuantificación inicial será una hipótesis; debe confirmarse con clientes y datos reales.'
      ),
      8
    ),
    (
      target_book_id,
      'key_point',
      'Diseña adquisición y ventas temprano',
      jsonb_build_object(
        'number', 4,
        'explanation', 'El producto no vive separado del proceso comercial. Necesitas saber quién decide, quién influye, cómo se compra, cuánto tarda la decisión y qué objeciones aparecen.',
        'example', 'En B2B, el usuario puede amar el producto, pero compras, finanzas o dirección pueden bloquear la adopción.',
        'action', 'Mapa la unidad de decisión: usuario final, comprador económico, influenciadores, aprobadores y bloqueadores.',
        'limitation', 'El mapa de ventas cambia cuando sales al mercado; úsalo como hipótesis viva, no como documento fijo.'
      ),
      9
    ),
    (
      target_book_id,
      'key_point',
      'Valida la economía del cliente',
      jsonb_build_object(
        'number', 5,
        'explanation', 'Un negocio necesita que el valor de vida del cliente sea superior al costo de adquirirlo. Si cada venta cuesta más de lo que deja, el problema no es solo de marketing: es estructural.',
        'example', 'Una suscripción de bajo precio puede parecer atractiva, pero si requiere ventas consultivas largas, el costo comercial puede destruir el margen.',
        'action', 'Estima LTV, COCA, precio, margen y tiempo de recuperación antes de comprometerte con un modelo.',
        'limitation', 'Las cifras tempranas son aproximadas; su valor está en revelar supuestos críticos para probar.'
      ),
      10
    ),
    (
      target_book_id,
      'key_point',
      'Prueba que el mercado lo acepta',
      jsonb_build_object(
        'number', 6,
        'explanation', 'La validación más fuerte no es una encuesta positiva, sino comportamiento real: clientes que pagan, usan el producto, vuelven o recomiendan.',
        'example', 'Una carta de intención, una preventa o un piloto pagado dice más que cien comentarios de me parece interesante.',
        'action', 'Define el supuesto más riesgoso y diseña una prueba que produzca evidencia observable en los próximos 7 días.',
        'limitation', 'No toda industria permite transacciones rápidas; aun así, busca señales más fuertes que opiniones.'
      ),
      11
    ),
    (
      target_book_id,
      'activity',
      'Test del Persona en 5 minutos',
      jsonb_build_object(
        'type', 'reflection',
        'prompt', 'Piensa en tu idea actual y escribe el nombre real de una persona que podría ser tu cliente. Describe su cargo, empresa, preocupación principal, solución actual y costo del problema en tiempo o dinero.',
        'options', jsonb_build_array('Nombre real del cliente', 'Cargo y contexto laboral', 'Problema que no lo deja avanzar', 'Solución actual', 'Costo actual del problema')
      ),
      12
    ),
    (
      target_book_id,
      'activity',
      'Canvas de Startup Disciplinado',
      jsonb_build_object(
        'type', 'checklist',
        'prompt', 'Completa una hoja con tu proyecto, beachhead market, Persona, problema central, propuesta de valor cuantificada, modelo de negocio, LTV, COCA, ventaja central, MVBP y supuesto más riesgoso.',
        'options', jsonb_build_array('Mercado de entrada', 'Persona real', 'Valor en números', 'Modelo de negocio', 'Supuesto más riesgoso')
      ),
      13
    ),
    (
      target_book_id,
      'activity',
      'Ruta de validación de 7 días',
      jsonb_build_object(
        'type', 'scenario',
        'prompt', 'Durante una semana, valida una sola hipótesis: habla con clientes, documenta patrones, ajusta la propuesta de valor y decide si avanzas, cambias de segmento o replanteas el problema.',
        'options', jsonb_build_array('Día 1: hipótesis', 'Días 2-4: entrevistas', 'Día 5: patrones', 'Día 6: ajuste', 'Día 7: decisión')
      ),
      14
    ),
    (
      target_book_id,
      'conclusion',
      'Conclusión editorial',
      jsonb_build_object(
        'content',
        'Disciplined Entrepreneurship es más útil para emprendedores que ya tienen una idea o tecnología y necesitan convertirla en un sistema de validación. Su fortaleza está en la especificidad; su riesgo es sentirse rígido si se usa como checklist ciego. El mejor uso es iterativo: avanzar con disciplina, aprender del mercado y volver a ajustar las respuestas críticas.'
      ),
      15
    );
end $$;
