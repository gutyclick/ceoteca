create or replace function public.seed_ceoteca_book(
  target_slug text,
  target_title text,
  target_author text,
  target_category text,
  target_description text,
  target_reading_time integer,
  target_difficulty text,
  target_tags text[],
  target_cover jsonb,
  target_purchase_url text
)
returns void
language plpgsql
as $$
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
    target_slug,
    target_title,
    target_author,
    target_category,
    target_description,
    target_cover,
    target_reading_time,
    target_difficulty,
    target_tags,
    target_purchase_url,
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
      'Idea central',
      jsonb_build_object(
        'content',
        'Este analisis editorial propio convierte una idea amplia del libro en decisiones pequenas que el lector puede probar esta semana.'
      ),
      1
    ),
    (
      target_book_id,
      'analysis',
      'Aplicacion practica',
      jsonb_build_object(
        'content',
        'La experiencia propone detectar un area concreta, elegir una accion minima y medir si esa accion reduce friccion o mejora claridad.'
      ),
      2
    ),
    (
      target_book_id,
      'analysis',
      'Limitacion util',
      jsonb_build_object(
        'content',
        'Ninguna idea funciona igual para todas las personas. El lector debe adaptar el enfoque a su contexto, energia y recursos disponibles.'
      ),
      3
    ),
    (
      target_book_id,
      'key_point',
      'Reduce la friccion',
      jsonb_build_object(
        'number', 1,
        'explanation', 'Una accion sencilla tiene mas probabilidad de repetirse que un plan perfecto pero pesado.',
        'example', 'Preparar el entorno la noche anterior puede hacer mas facil estudiar, ahorrar o entrenar.',
        'action', 'Elige una accion de menos de cinco minutos para comenzar hoy.',
        'limitation', 'Lo pequeno no reemplaza una estrategia completa; solo ayuda a iniciar con menos resistencia.'
      ),
      4
    ),
    (
      target_book_id,
      'key_point',
      'Mide lo que importa',
      jsonb_build_object(
        'number', 2,
        'explanation', 'El progreso se vuelve visible cuando se registra una senal concreta y facil de revisar.',
        'example', 'Marcar tres sesiones completadas puede ser mas util que esperar motivacion perfecta.',
        'action', 'Define una metrica simple para los proximos siete dias.',
        'limitation', 'Medir demasiado puede distraer; conviene elegir una sola senal principal.'
      ),
      5
    ),
    (
      target_book_id,
      'key_point',
      'Adapta antes de abandonar',
      jsonb_build_object(
        'number', 3,
        'explanation', 'Cuando una practica falla, puede necesitar ajuste de contexto, horario o dificultad.',
        'example', 'Si leer de noche no funciona, prueba diez minutos despues del almuerzo.',
        'action', 'Cambia una variable antes de descartar el habito o sistema.',
        'limitation', 'Algunas metas requieren apoyo externo o condiciones que no dependen solo del usuario.'
      ),
      6
    ),
    (
      target_book_id,
      'activity',
      'Pregunta de reflexion',
      jsonb_build_object(
        'type', 'reflection',
        'prompt', 'Que accion pequena te acercaria a este aprendizaje sin depender de motivacion alta?'
      ),
      7
    ),
    (
      target_book_id,
      'activity',
      'Checklist de inicio',
      jsonb_build_object(
        'type', 'checklist',
        'prompt', 'Marca tres condiciones que puedes preparar antes de empezar.',
        'options', jsonb_build_array('Lugar definido', 'Recordatorio visible', 'Tiempo bloqueado', 'Meta reducida')
      ),
      8
    ),
    (
      target_book_id,
      'activity',
      'Escenario practico',
      jsonb_build_object(
        'type', 'scenario',
        'prompt', 'Imagina que solo tienes 12 minutos al dia. Que parte del aprendizaje conservarias y que eliminarias?'
      ),
      9
    ),
    (
      target_book_id,
      'conclusion',
      'Conclusion editorial',
      jsonb_build_object(
        'content',
        'Conclusion editorial inicial: el aprendizaje mas util no es acumular ideas, sino convertir una idea en una accion pequena y repetible.'
      ),
      10
    );
end;
$$;

select public.seed_ceoteca_book(
  'habitos-atomicos',
  'Habitos Atomicos',
  'James Clear',
  'Habitos',
  'Analisis editorial sobre como disenar sistemas simples para sostener pequenas mejoras diarias.',
  12,
  'Inicial',
  array['habitos', 'disciplina', 'sistemas'],
  '{"variant":"orb","gradient":"from-brand-blue via-brand-purple to-brand-pink","accent":"text-brand-pink"}'::jsonb,
  'https://www.google.com/search?q=Habitos+Atomicos+James+Clear'
);

select public.seed_ceoteca_book(
  'padre-rico-padre-pobre',
  'Padre Rico, Padre Pobre',
  'Robert Kiyosaki',
  'Finanzas',
  'Ideas editoriales sobre mentalidad financiera, activos, pasivos y decisiones de dinero mas conscientes.',
  14,
  'Inicial',
  array['finanzas', 'dinero', 'activos'],
  '{"variant":"steps","gradient":"from-emerald-300 to-cyan-400","accent":"text-emerald-200"}'::jsonb,
  'https://www.google.com/search?q=Padre+Rico+Padre+Pobre+Robert+Kiyosaki'
);

select public.seed_ceoteca_book(
  'startup-100',
  'La Startup de $100',
  'Chris Guillebeau',
  'Emprendimiento',
  'Lectura editorial sobre validar ofertas pequenas, vender pronto y construir negocios livianos.',
  11,
  'Inicial',
  array['negocios', 'ventas', 'validacion'],
  '{"variant":"growth","gradient":"from-orange-300 to-rose-400","accent":"text-orange-200"}'::jsonb,
  'https://www.google.com/search?q=La+Startup+de+100+Chris+Guillebeau'
);

select public.seed_ceoteca_book(
  'hombre-rico-babilonia',
  'El Hombre Mas Rico de Babilonia',
  'George S. Clason',
  'Finanzas',
  'Principios editoriales de ahorro, disciplina y construccion gradual de patrimonio personal.',
  10,
  'Inicial',
  array['ahorro', 'patrimonio', 'finanzas'],
  '{"variant":"steps","gradient":"from-amber-300 to-yellow-500","accent":"text-yellow-200"}'::jsonb,
  'https://www.google.com/search?q=El+Hombre+Mas+Rico+de+Babilonia'
);

select public.seed_ceoteca_book(
  'pensar-rapido-pensar-despacio',
  'Pensar Rapido, Pensar Despacio',
  'Daniel Kahneman',
  'Psicologia',
  'Mapa editorial para reconocer sesgos, intuicion y decisiones que merecen mas pausa.',
  15,
  'Avanzado',
  array['decisiones', 'sesgos', 'mente'],
  '{"variant":"grid","gradient":"from-indigo-300 to-violet-500","accent":"text-indigo-200"}'::jsonb,
  'https://www.google.com/search?q=Pensar+Rapido+Pensar+Despacio+Daniel+Kahneman'
);

select public.seed_ceoteca_book(
  'poder-del-ahora',
  'El Poder del Ahora',
  'Eckhart Tolle',
  'Psicologia',
  'Reflexiones editoriales sobre presencia, atencion y reduccion de ruido mental en la vida diaria.',
  13,
  'Intermedio',
  array['presencia', 'atencion', 'calma'],
  '{"variant":"orb","gradient":"from-sky-300 to-blue-500","accent":"text-sky-200"}'::jsonb,
  'https://www.google.com/search?q=El+Poder+del+Ahora+Eckhart+Tolle'
);

select public.seed_ceoteca_book(
  'como-ganar-amigos',
  'Como Ganar Amigos e Influir Sobre las Personas',
  'Dale Carnegie',
  'Liderazgo',
  'Ideas editoriales sobre escucha, empatia y relaciones profesionales mas cuidadosas.',
  12,
  'Inicial',
  array['comunicacion', 'relaciones', 'influencia'],
  '{"variant":"people","gradient":"from-cyan-300 to-blue-600","accent":"text-cyan-200"}'::jsonb,
  'https://www.google.com/search?q=Como+Ganar+Amigos+e+Influir+Sobre+las+Personas'
);

select public.seed_ceoteca_book(
  'semana-laboral-4-horas',
  'La Semana Laboral de 4 Horas',
  'Tim Ferriss',
  'Productividad',
  'Analisis editorial sobre foco, delegacion, automatizacion y diseno de tiempo.',
  13,
  'Intermedio',
  array['tiempo', 'foco', 'automatizacion'],
  '{"variant":"bolt","gradient":"from-violet-300 to-fuchsia-500","accent":"text-fuchsia-200"}'::jsonb,
  'https://www.google.com/search?q=La+Semana+Laboral+de+4+Horas+Tim+Ferriss'
);

select public.seed_ceoteca_book(
  'mindset',
  'Mindset',
  'Carol S. Dweck',
  'Productividad',
  'Contenido editorial sobre mentalidad de crecimiento, aprendizaje y respuesta al error.',
  11,
  'Inicial',
  array['aprendizaje', 'mentalidad', 'crecimiento'],
  '{"variant":"growth","gradient":"from-lime-300 to-emerald-500","accent":"text-lime-200"}'::jsonb,
  'https://www.google.com/search?q=Mindset+Carol+Dweck'
);

select public.seed_ceoteca_book(
  'inversor-inteligente',
  'El Inversor Inteligente',
  'Benjamin Graham',
  'Finanzas',
  'Vista editorial sobre prudencia, margen de seguridad y disciplina al invertir.',
  15,
  'Avanzado',
  array['inversion', 'riesgo', 'valor'],
  '{"variant":"grid","gradient":"from-slate-300 to-emerald-500","accent":"text-emerald-200"}'::jsonb,
  'https://www.google.com/search?q=El+Inversor+Inteligente+Benjamin+Graham'
);

drop function public.seed_ceoteca_book(
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  text[],
  jsonb,
  text
);
