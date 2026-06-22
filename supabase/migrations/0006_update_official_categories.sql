update public.books
set category = case slug
  when 'habitos-atomicos' then 'Desarrollo personal'
  when 'padre-rico-padre-pobre' then 'Finanzas personales'
  when 'startup-100' then 'Emprendimiento'
  when 'hombre-rico-babilonia' then 'Ingresos y riqueza'
  when 'pensar-rapido-pensar-despacio' then 'Psicología y comportamiento'
  when 'poder-del-ahora' then 'Desarrollo personal'
  when 'como-ganar-amigos' then 'Comunicación'
  when 'semana-laboral-4-horas' then 'Productividad'
  when 'mindset' then 'Desarrollo personal'
  when 'inversor-inteligente' then 'Inversiones'
  else category
end
where slug in (
  'habitos-atomicos',
  'padre-rico-padre-pobre',
  'startup-100',
  'hombre-rico-babilonia',
  'pensar-rapido-pensar-despacio',
  'poder-del-ahora',
  'como-ganar-amigos',
  'semana-laboral-4-horas',
  'mindset',
  'inversor-inteligente'
);
