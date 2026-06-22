update public.books
set
  title = 'La disciplina de emprender',
  description = 'Análisis de Disciplined Entrepreneurship: la metodología del MIT para convertir una idea de startup en un proceso disciplinado de mercado, cliente, valor, producto y validación.',
  cover_config = '{"variant":"growth","gradient":"from-indigo-400 via-brand-purple to-brand-pink","accent":"text-brand-purple"}'::jsonb,
  tags = array['startup', 'validación', 'cliente', 'innovación', 'modelo de negocio', 'MIT', 'emprendimiento disciplinado']
where slug = 'disciplined-entrepreneurship';

update public.book_sections
set content = jsonb_build_object(
  'content',
  'Disciplined Entrepreneurship desmonta la idea de que los grandes emprendedores simplemente nacen. El enfoque de Bill Aulet, desde el MIT, es que emprender puede aprenderse como un conjunto de habilidades observables: elegir un mercado, entender al cliente, cuantificar valor, diseñar adquisición, validar supuestos y construir un producto que pueda convertirse en negocio.'
)
where book_id = (
  select id from public.books where slug = 'disciplined-entrepreneurship'
)
and section_type = 'analysis'
and position = 1;

update public.book_sections
set content = jsonb_build_object(
  'content',
  'La fórmula central del análisis es clara: Innovación = Invención × Comercialización. Una invención sin comercialización no crea impacto, y una buena comercialización sin una propuesta diferencial tampoco sostiene una ventaja. La pregunta deja de ser solo qué queremos construir y pasa a ser quién pagaría, por qué, cuánto valor recibe y cómo llegamos a esa persona.'
)
where book_id = (
  select id from public.books where slug = 'disciplined-entrepreneurship'
)
and section_type = 'analysis'
and position = 2;

update public.book_sections
set content = jsonb_build_object(
  'content',
  'Antes de explicar los 24 pasos, Aulet diferencia dos caminos: pequeñas empresas orientadas a independencia, mercados locales y crecimiento lineal, frente a empresas impulsadas por innovación que buscan escala, mercados amplios, capital externo y ventajas difíciles de copiar. Ninguna es superior por defecto, pero confundirlas puede llevar a decisiones equivocadas de producto, financiamiento, equipo y crecimiento.'
)
where book_id = (
  select id from public.books where slug = 'disciplined-entrepreneurship'
)
and section_type = 'analysis'
and position = 3;
