-- CEOTECA Training: primer paquete editorial real del MVP.
-- Marketing y marca + Ventas y persuasión. IDs estables e inserciones idempotentes.

create or replace function public.training_seed_uuid(seed text)
returns uuid language sql immutable strict as $$
  select (substr(md5(seed),1,8)||'-'||substr(md5(seed),9,4)||'-4'||substr(md5(seed),14,3)||'-a'||substr(md5(seed),18,3)||'-'||substr(md5(seed),21,12))::uuid
$$;

-- Normaliza las cinco habilidades de cada categoría sin romper relaciones existentes.
with desired(category_slug,old_slug,slug,name,subcategory_name,objectives,formats,types) as (values
 ('marketing-y-marca','evaluar-coherencia-de-marca','evaluar-coherencia-de-marca','Evaluar coherencia de marca','Branding',array['Diagnosticar rupturas entre identidad, mensaje y audiencia','Justificar ajustes con criterios observables'],array['deterministic-practice','visual-analysis','case-analysis'],array['single_choice','scenario','visual_comparison']),
 ('marketing-y-marca','analizar-jerarquia-visual','analizar-jerarquia-visual','Analizar jerarquía visual','Identidad visual',array['Reconocer el punto focal','Ordenar información para facilitar la lectura'],array['visual-analysis','diagnosis','deterministic-practice'],array['visual_diagnosis','visual_ranking','ordering']),
 ('marketing-y-marca','identificar-una-propuesta-de-valor-debil','crear-propuestas-de-valor','Crear propuestas de valor','Propuesta de valor',array['Conectar audiencia, problema y resultado','Expresar una diferencia creíble'],array['guided-builder','written-response','case-analysis'],array['guided_builder','open_response','scenario']),
 ('marketing-y-marca','escribir-titulares-claros','crear-slogans','Crear slogans','Copywriting',array['Sintetizar una promesa memorable','Alinear tono y credibilidad'],array['written-response','deterministic-practice'],array['open_response','single_choice']),
 ('marketing-y-marca','disenar-una-oferta','evaluar-anuncios','Evaluar anuncios','Publicidad',array['Diagnosticar titular, oferta y CTA','Priorizar mejoras de claridad y coherencia'],array['visual-analysis','diagnosis','case-analysis'],array['visual_diagnosis','scenario','decision_justification']),
 ('ventas-y-persuasion','hacer-preguntas-de-descubrimiento','descubrir-necesidades','Descubrir necesidades','Descubrimiento de necesidades',array['Formular preguntas abiertas sin dirigir','Identificar impacto, urgencia y prioridad'],array['deterministic-practice','case-analysis','written-response'],array['single_choice','conversation_diagnosis','open_response']),
 ('ventas-y-persuasion','responder-objeciones','responder-objeciones','Responder objeciones','Manejo de objeciones',array['Aclarar antes de responder','Reencuadrar con empatía y evidencia'],array['written-response','case-analysis','decision-simulation'],array['objection_response','message_comparison','scenario']),
 ('ventas-y-persuasion','defender-precio','defender-precio','Defender precio','Presentación de valor',array['Conectar precio con resultado y alcance','Negociar concesiones sin devaluar la oferta'],array['case-analysis','written-response','decision-simulation'],array['scenario','message_response','decision_justification']),
 ('ventas-y-persuasion','escribir-seguimiento','escribir-seguimientos','Escribir seguimientos','Seguimiento',array['Recuperar contexto con brevedad','Proponer un siguiente paso fácil de responder'],array['written-response','case-analysis'],array['email_rewrite','tone_adjustment','message_response']),
 ('ventas-y-persuasion','cerrar-sin-presion','cerrar-con-claridad','Cerrar con claridad','Cierre',array['Confirmar acuerdos sin presión','Reducir fricción en el siguiente paso'],array['written-response','decision-simulation','case-analysis'],array['message_response','scenario','guided_builder'])
), updated as (
 update public.training_skills s set
   slug=d.slug,name=d.name,subcategory_id=sc.id,description='Habilidad práctica para '||lower(d.name)||' con criterio ético y observable.',
   learning_objectives=d.objectives,compatible_formats=d.formats,compatible_exercise_types=d.types,
   difficulty_start='fundamentals',difficulty_max='advanced',initial_difficulty='beginner',maximum_difficulty='advanced',
   minimum_plan='free',allowed_plans=array['free','pro','unlimited'],preview_allowed=true,status='published',is_active=true
 from desired d join public.training_categories c on c.slug=d.category_slug
 join public.training_subcategories sc on sc.category_id=c.id and sc.name=d.subcategory_name
 where s.category_id=c.id and s.slug=d.old_slug returning s.id
)
select count(*) from updated;

-- Cuatro conceptos por habilidad (20 por categoría). Los tres IDs existentes se reutilizan.
do $$
declare row record; concept_id uuid;
begin
  for row in
    with catalog(skill_slug,concepts) as (values
      ('evaluar-coherencia-de-marca',array['Personalidad de marca','Consistencia visual','Adecuación al público','Diferenciación']),
      ('analizar-jerarquia-visual',array['Punto focal','Contraste','Orden de lectura','Carga visual']),
      ('crear-propuestas-de-valor',array['Público específico','Problema prioritario','Resultado verificable','Diferenciador creíble']),
      ('crear-slogans',array['Brevedad','Memorabilidad','Relevancia','Credibilidad']),
      ('evaluar-anuncios',array['Titular','Claridad de oferta','Llamada a la acción','Coherencia visual']),
      ('descubrir-necesidades',array['Preguntas abiertas','Problema real','Impacto y urgencia','Escucha activa']),
      ('responder-objeciones',array['Clarificación','Empatía','Reencuadre','Prueba relevante']),
      ('defender-precio',array['Valor percibido','Coste de inacción','Alcance','Concesiones recíprocas']),
      ('escribir-seguimientos',array['Contexto','Brevedad','Valor adicional','CTA de seguimiento']),
      ('cerrar-con-claridad',array['Resumen de acuerdos','Siguiente paso','Compromiso','Reducción de fricción'])
    )
    select s.id skill_id,s.slug skill_slug,item concept_name,ord::int concept_order,
      s.slug||'-'||trim(both '-' from regexp_replace(lower(translate(item,'áéíóúüñ','aeiouun')),'[^a-z0-9]+','-','g')) concept_slug
    from catalog join public.training_skills s on s.slug=catalog.skill_slug,
      unnest(catalog.concepts) with ordinality x(item,ord)
  loop
    select id into concept_id from public.training_concepts where slug=row.concept_slug;
    if concept_id is null then
      select id into concept_id from public.training_concepts
        where skill_id=row.skill_id
        order by created_at,id offset row.concept_order-1 limit 1;
    end if;
    if concept_id is null then concept_id:=public.training_seed_uuid('mvp-concept-'||row.concept_slug); end if;
    insert into public.training_concepts(id,skill_id,slug,name,description,difficulty,is_active,editorial_summary,explanation,common_mistakes,approved_examples,recommended_cognitive_level,compatible_formats,status,minimum_plan,allowed_plans,preview_allowed)
    values(concept_id,row.skill_id,row.concept_slug,row.concept_name,
      'Criterio práctico para trabajar '||lower(row.concept_name)||' en casos de negocio ficticios.','intermediate',true,
      row.concept_name||' ayuda a tomar decisiones más claras y coherentes.',
      'Se aplica observando el contexto, comparando alternativas y justificando la opción con evidencia disponible.',
      jsonb_build_array('Aplicar una regla sin considerar el contexto','Confundir una preferencia personal con evidencia'),
      jsonb_build_array('Caso ficticio de CEOTECA con una decisión observable'),
      (array['recognition','understanding','application','analysis'])[row.concept_order],
      array['deterministic-practice','case-analysis','written-response'],'published','free',array['free','pro','unlimited'],true)
    on conflict(id) do update set slug=excluded.slug,name=excluded.name,description=excluded.description,editorial_summary=excluded.editorial_summary,
      explanation=excluded.explanation,common_mistakes=excluded.common_mistakes,approved_examples=excluded.approved_examples,
      recommended_cognitive_level=excluded.recommended_cognitive_level,status='published',is_active=true;
  end loop;
end $$;

-- Matriz editorial compacta: contexto, decisión correcta y error plausible varían por concepto.
create temporary table training_mvp_matrix on commit drop as
select c.id concept_id,s.id skill_id,cat.slug category_slug,s.slug skill_slug,c.slug concept_slug,c.name concept_name,
 row_number() over(partition by cat.slug order by s.created_at,s.id,c.created_at,c.id)::int n,
 case cat.slug
  when 'marketing-y-marca' then 'La marca ficticia Nexo Norte prepara una campaña para profesionales independientes y debe decidir cómo presentar '||lower(c.name)||'.'
  else 'El equipo comercial ficticio Cauce conversa con una empresa pequeña y necesita aplicar '||lower(c.name)||' sin presionar al cliente.' end context_text,
 case cat.slug
  when 'marketing-y-marca' then 'Elegir una alternativa coherente con la audiencia, el mensaje principal y la acción esperada.'
  else 'Aclarar el contexto, conectar valor con la necesidad y acordar un siguiente paso concreto.' end good_action,
 case cat.slug
  when 'marketing-y-marca' then 'Elegir la opción más llamativa aunque contradiga el posicionamiento y dificulte la lectura.'
  else 'Responder de inmediato con un descuento o una frase de presión sin comprender la objeción.' end weak_action
from public.training_concepts c join public.training_skills s on s.id=c.skill_id
join public.training_categories cat on cat.id=s.category_id
where cat.slug in('marketing-y-marca','ventas-y-persuasion') and s.status='published' and c.status='published';

-- 30 ejercicios deterministas por categoría: uno por concepto y una segunda aplicación para los primeros diez.
with variants as (
 select m.*,v.variant,
   public.training_seed_uuid('mvp-det-'||m.category_slug||'-'||m.n||'-'||v.variant) id
 from training_mvp_matrix m cross join lateral generate_series(1,case when m.n<=10 then 2 else 1 end) v(variant)
), upserted as (
 insert into public.training_exercises(id,skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,allowed_plans,preview_allowed,evaluation_mode)
 select id,skill_id,concept_id,
   case (n+variant)%5 when 0 then 'true_false' when 1 then 'ordering' when 2 then 'scenario' when 3 then 'multiple_choice' else 'single_choice' end,
   'MVP · '||concept_name||case variant when 1 then ': reconoce el criterio' else ': aplícalo al caso' end,
   context_text||' ¿Cuál decisión demuestra mejor el criterio de '||lower(concept_name)||'?',
   case variant when 1 then 'Analiza las señales disponibles y elige la respuesta mejor sustentada.' else 'Aplica el concepto al caso y evita resolverlo solo por intuición.' end,
   case when n<=8 then 'beginner' when n<=16 then 'intermediate' else 'advanced' end,90,
   'Busca la opción que usa evidencia y deja un siguiente paso verificable.',
   'La respuesta sólida considera el contexto y convierte '||lower(concept_name)||' en una acción observable. La alternativa débil confunde intensidad con efectividad.',
   case (n+variant)%5
    when 0 then jsonb_build_object('statement',weak_action,'objective','Distinguir una aplicación responsable de '||lower(concept_name),'commonErrors',jsonb_build_array('Aceptar una afirmación por su tono seguro'),'editorialSource','CEOTECA Training, caso original 2026')
    when 1 then jsonb_build_object('items',jsonb_build_array(jsonb_build_object('id','observe','label','Observar el contexto'),jsonb_build_object('id','compare','label','Comparar alternativas'),jsonb_build_object('id','decide','label','Elegir y justificar'),jsonb_build_object('id','verify','label','Comprobar el resultado')),'objective','Ordenar una decisión basada en '||lower(concept_name),'commonErrors',jsonb_build_array('Decidir antes de observar'),'editorialSource','CEOTECA Training, caso original 2026')
    when 2 then jsonb_build_object('context',context_text,'options',jsonb_build_array(jsonb_build_object('id','evidence','label',good_action),jsonb_build_object('id','impulse','label',weak_action),jsonb_build_object('id','delay','label','Posponer sin definir qué información falta.')),'correctOptionId','evidence','consequence','La decisión produce aprendizaje verificable.','principle',concept_name||' se evalúa con contexto y evidencia.','practicalApplication','Define una señal que permita revisar el resultado.','objective','Aplicar '||lower(concept_name),'commonErrors',jsonb_build_array('Elegir por preferencia personal'),'editorialSource','CEOTECA Training, caso original 2026')
    else jsonb_build_object('options',jsonb_build_array(jsonb_build_object('id','evidence','label',good_action),jsonb_build_object('id','impulse','label',weak_action),jsonb_build_object('id','delay','label','Esperar sin formular una hipótesis ni un siguiente paso.')),'selectionCount',1,'objective','Evaluar '||lower(concept_name),'commonErrors',jsonb_build_array('Confundir actividad con progreso'),'editorialSource','CEOTECA Training, caso original 2026') end,
   'published',case when variant=1 then case when n<=6 then 'recognition' else 'understanding' end else case when n<=12 then 'application' else 'analysis' end end,
   case when n<=5 and variant=1 then 'free' when n>25 then 'unlimited' else 'pro' end,
   case when n<=5 and variant=1 then array['free','pro','unlimited'] when n>25 then array['unlimited'] else array['pro','unlimited'] end,
   n<=5 and variant=1,'deterministic'
 from variants
 on conflict(id) do update set title=excluded.title,prompt=excluded.prompt,instruction=excluded.instruction,content=excluded.content,
   explanation=excluded.explanation,status='published',cognitive_level=excluded.cognitive_level,minimum_plan=excluded.minimum_plan,allowed_plans=excluded.allowed_plans
 returning id
)
select count(*) from upserted;

insert into public.training_exercise_evaluation_rules(exercise_id,evaluation_config)
select e.id,case e.type
 when 'true_false' then jsonb_build_object('correctValue',false)
 when 'ordering' then jsonb_build_object('correctOrder',jsonb_build_array('observe','compare','decide','verify'))
 when 'multiple_choice' then jsonb_build_object('correctOptionIds',jsonb_build_array('evidence'))
 else jsonb_build_object('correctOptionId','evidence') end
from public.training_exercises e where e.id in(select public.training_seed_uuid('mvp-det-'||category_slug||'-'||n||'-'||variant) from training_mvp_matrix cross join lateral generate_series(1,case when n<=10 then 2 else 1 end) v(variant))
on conflict(exercise_id) do update set evaluation_config=excluded.evaluation_config;

insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select e.id,f.id,true from public.training_exercises e join public.training_formats f on f.slug='deterministic-practice'
where e.id in(select public.training_seed_uuid('mvp-det-'||category_slug||'-'||n||'-'||variant) from training_mvp_matrix cross join lateral generate_series(1,case when n<=10 then 2 else 1 end) v(variant))
on conflict(exercise_id,format_id) do update set is_primary=true;

-- Diez assets visuales originales. Se sirven con la app y no dependen de logos comerciales.
with assets(n,file,alt) as (values
 (1,'marca-norte.png','Tarjeta de identidad ficticia Norte con composición sobria y acento violeta.'),
 (2,'marca-brio.png','Tarjeta de identidad ficticia Brío con acento verde y lenguaje de movimiento.'),
 (3,'marca-lumen.png','Tarjeta de identidad ficticia Lumen con jerarquía tipográfica y acento naranja.'),
 (4,'jerarquia-claridad.png','Composición ficticia con titular, beneficio y acción en orden claro.'),
 (5,'jerarquia-ruido.png','Composición ficticia donde varios mensajes compiten por la atención.'),
 (6,'propuesta-alba.png','Propuesta de valor ficticia Alba para organizar prioridades de equipos pequeños.'),
 (7,'slogan-claro.png','Identidad ficticia Trazo con un slogan breve y relacionado con su servicio.'),
 (8,'slogan-generico.png','Identidad ficticia Trazo con un slogan genérico y poco diferenciador.'),
 (9,'anuncio-cauce.png','Anuncio ficticio Cauce con problema concreto, oferta y llamada a la acción.'),
 (10,'landing-marea.png','Landing ficticia Marea con audiencia, resultado y demostración como siguiente paso.')
)
insert into public.training_visual_assets(id,storage_path,mime_type,width,height,alt_text,source_type,copyright_status)
select public.training_seed_uuid('mvp-asset-'||n),'/images/training/mvp/'||file,'image/png',1200,760,alt,'original','approved' from assets
on conflict(id) do update set storage_path=excluded.storage_path,alt_text=excluded.alt_text,copyright_status='approved';

-- Diez ejercicios visuales de Marketing.
with source as (select * from training_mvp_matrix where category_slug='marketing-y-marca' and n<=10), created as (
 insert into public.training_exercises(id,skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,allowed_plans,preview_allowed,evaluation_mode,visual_alternative)
 select public.training_seed_uuid('mvp-visual-'||n),skill_id,concept_id,
   (array['visual_single_choice','visual_comparison','visual_diagnosis','visual_ranking'])[((n-1)%4)+1],
   'MVP · Laboratorio visual: '||concept_name,
   'Observa el caso ficticio y evalúa cómo influye '||lower(concept_name)||' en la claridad de la marca.',
   'Usa criterios de audiencia, legibilidad y coherencia; no respondas solo por gusto personal.',
   case when n<=4 then 'intermediate' else 'advanced' end,150,'Identifica primero la función que debe cumplir la pieza.',
   'La evaluación visual se apoya en una prioridad comunicativa, una audiencia y una acción esperada; no existe una preferencia universal.',
   jsonb_build_object('assets',jsonb_build_array(jsonb_build_object('id',public.training_seed_uuid('mvp-asset-'||n),'label','Caso visual '||n,'imageUrl','/images/training/mvp/'||(array['marca-norte.png','marca-brio.png','marca-lumen.png','jerarquia-claridad.png','jerarquia-ruido.png','propuesta-alba.png','slogan-claro.png','slogan-generico.png','anuncio-cauce.png','landing-marea.png'])[n],'altText',(select alt_text from public.training_visual_assets where id=public.training_seed_uuid('mvp-asset-'||n)))))
     ||case ((n-1)%4)+1 when 4 then jsonb_build_object('correctOrder',jsonb_build_array('focal','support','action')) else jsonb_build_object('options',jsonb_build_array(jsonb_build_object('id','criteria','label','La pieza establece una prioridad y facilita una acción.'),jsonb_build_object('id','taste','label','La pieza funciona porque usa el color que prefiero.'),jsonb_build_object('id','noise','label','La pieza mejora si todos los elementos tienen el mismo peso.')),'correctOptionId','criteria') end
     ||jsonb_build_object('objective','Evaluar '||lower(concept_name)||' con criterios observables','commonErrors',jsonb_build_array('Confundir gusto con función','Ignorar la audiencia'),'editorialSource','CEOTECA Training, activo original 2026'),
   'published',case when n<=3 then 'application' when n<=7 then 'analysis' else 'synthesis' end,case when n>=9 then 'unlimited' else 'pro' end,
   case when n>=9 then array['unlimited'] else array['pro','unlimited'] end,false,'deterministic',
   'Descripción textual disponible: identifica prioridad, legibilidad, coherencia y acción esperada.'
 from source on conflict(id) do update set title=excluded.title,prompt=excluded.prompt,content=excluded.content,explanation=excluded.explanation,status='published' returning id,type
)
select count(*) from created;

insert into public.training_exercise_evaluation_rules(exercise_id,evaluation_config)
select public.training_seed_uuid('mvp-visual-'||n),case when ((n-1)%4)+1=4 then jsonb_build_object('correctOrder',jsonb_build_array('focal','support','action')) else jsonb_build_object('correctOptionId','criteria') end from generate_series(1,10)n
on conflict(exercise_id) do update set evaluation_config=excluded.evaluation_config;
insert into public.training_exercise_assets(exercise_id,asset_id,label,sort_order)
select public.training_seed_uuid('mvp-visual-'||n),public.training_seed_uuid('mvp-asset-'||n),'Caso visual',1 from generate_series(1,10)n on conflict do nothing;
insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select public.training_seed_uuid('mvp-visual-'||n),f.id,true from generate_series(1,10)n cross join public.training_formats f where f.slug='visual-analysis'
on conflict(exercise_id,format_id) do update set is_primary=true;

-- Marketing: diez respuestas abiertas/builders. Ventas: doce mensajes y ocho respuestas abiertas.
with source as (
 select m.*,'marketing-open' family,n-10 seq from training_mvp_matrix m where category_slug='marketing-y-marca' and n between 11 and 20
 union all select m.*,'sales-message',n from training_mvp_matrix m where category_slug='ventas-y-persuasion' and n<=12
 union all select m.*,'sales-open',n-12 from training_mvp_matrix m where category_slug='ventas-y-persuasion' and n between 13 and 20
), prepared as (
 select *,public.training_seed_uuid('mvp-'||family||'-'||seq) id,
  case family
   when 'marketing-open' then case when seq%2=0 then 'guided_builder' else 'open_response' end
   when 'sales-message' then (array['message_response','message_comparison','objection_response','tone_adjustment','email_rewrite','conversation_diagnosis'])[((seq-1)%6)+1]
   else case when seq%3=0 then 'guided_builder' when seq%3=1 then 'decision_justification' else 'open_response' end end exercise_type
 from source
), created as (
 insert into public.training_exercises(id,skill_id,concept_id,type,title,prompt,instruction,difficulty,estimated_seconds,hint,explanation,content,status,cognitive_level,minimum_plan,allowed_plans,preview_allowed,evaluation_mode,ai_rubric,ai_prompt_version,minimum_response_length,maximum_response_length,allow_revision,max_revisions)
 select id,skill_id,concept_id,exercise_type,
  'MVP · '||case family when 'marketing-open' then 'Taller de marca: ' when 'sales-message' then 'Conversación comercial: ' else 'Taller de venta: ' end||concept_name,
  case family
   when 'marketing-open' then context_text||' Construye una mejora concreta que demuestre '||lower(concept_name)||'.'
   when 'sales-message' then context_text||' El cliente escribe: "Necesito pensarlo y comparar otras opciones". Redacta una respuesta que aplique '||lower(concept_name)||'.'
   else context_text||' Explica qué harías para aplicar '||lower(concept_name)||' y qué señal usarías para evaluar el avance.' end,
  'Responde en lenguaje natural, evita presión o promesas absolutas y termina con un siguiente paso verificable.',
  case when seq<=4 then 'intermediate' else 'advanced' end,240,'Incluye contexto, criterio, acción y una forma de comprobar el resultado.',
  'Una respuesta fuerte combina claridad, empatía y criterio. Debe ser útil incluso si la otra persona decide no avanzar.',
  case when exercise_type='guided_builder' then jsonb_build_object('fields',jsonb_build_array(jsonb_build_object('id','context','label','Contexto','prompt','¿Qué sabemos y qué falta confirmar?'),jsonb_build_object('id','decision','label','Decisión','prompt','¿Qué propones y por qué?'),jsonb_build_object('id','verification','label','Comprobación','prompt','¿Cómo sabrás si funcionó?')),'template','Contexto: {{context}}\nDecisión: {{decision}}\nComprobación: {{verification}}')
   when exercise_type='decision_justification' then jsonb_build_object('options',jsonb_build_array(jsonb_build_object('id','clarify','label','Aclarar y proponer un paso pequeño'),jsonb_build_object('id','pressure','label','Presionar para cerrar hoy'),jsonb_build_object('id','discount','label','Ofrecer descuento sin diagnóstico')),'placeholder','Justifica tu decisión con el contexto del caso...')
   else jsonb_build_object('context',context_text,'placeholder',case family when 'sales-message' then 'Escribe un mensaje breve, humano y accionable...' else 'Desarrolla tu respuesta con criterios observables...' end) end
   ||jsonb_build_object('objective','Transferir '||lower(concept_name)||' a una situación realista','commonErrors',jsonb_build_array('Responder sin aclarar el contexto','Usar afirmaciones absolutas','Omitir el siguiente paso'),'editorialSource','CEOTECA Training, caso original 2026'),
  'published',case when seq<=3 then 'application' when seq<=7 then 'analysis' else 'transfer' end,
  case when family='sales-message' and seq>10 then 'unlimited' when family<>'sales-message' and seq>7 then 'unlimited' else 'pro' end,
  case when (family='sales-message' and seq>10) or (family<>'sales-message' and seq>7) then array['unlimited'] else array['pro','unlimited'] end,false,'ai',
  jsonb_build_object('criteria',jsonb_build_array(
    jsonb_build_object('name','Claridad','weight',25,'description','Expresa una idea principal comprensible.'),
    jsonb_build_object('name','Contexto y empatía','weight',25,'description','Reconoce la situación sin asumir ni manipular.'),
    jsonb_build_object('name','Criterio aplicado','weight',30,'description','Usa el concepto para justificar una decisión.'),
    jsonb_build_object('name','Siguiente paso','weight',20,'description','Propone una acción concreta y proporcionada.')),'passingScore',70),
  'training-mvp-open-v1',50,1200,true,1
 from prepared on conflict(id) do update set title=excluded.title,prompt=excluded.prompt,instruction=excluded.instruction,content=excluded.content,
   explanation=excluded.explanation,ai_rubric=excluded.ai_rubric,status='published',minimum_plan=excluded.minimum_plan,allowed_plans=excluded.allowed_plans returning id
)
select count(*) from created;

insert into public.training_exercise_formats(exercise_id,format_id,is_primary)
select p.id,f.id,true from (
 select public.training_seed_uuid('mvp-marketing-open-'||n) id,'guided-builder' slug from generate_series(1,10)n
 union all select public.training_seed_uuid('mvp-sales-message-'||n),'written-response' from generate_series(1,12)n
 union all select public.training_seed_uuid('mvp-sales-open-'||n),'written-response' from generate_series(1,8)n
)p join public.training_formats f on f.slug=p.slug on conflict(exercise_id,format_id) do update set is_primary=true;

-- Dos rutas completas, diez módulos y cuatro actividades por módulo.
with paths(slug,name,promise,description,outcome,category_slug) as (values
 ('construye-una-marca-fuerte','Construye una marca fuerte','Crea una marca coherente que pueda explicarse y evaluarse.','Ruta progresiva de audiencia, posicionamiento, identidad, propuesta, slogan y anuncios.','Un caso final de marca sustentado con criterios observables.','marketing-y-marca'),
 ('aprende-a-vender','Aprende a vender','Conduce conversaciones comerciales claras, éticas y accionables.','Ruta progresiva de descubrimiento, valor, objeciones, precio, seguimiento y cierre.','Una conversación de venta con diagnóstico y siguiente paso.','ventas-y-persuasion')
)
insert into public.training_learning_paths(id,slug,name,promise,description,expected_outcome,estimated_minutes,difficulty,minimum_plan,allowed_plans,preview_allowed,status,version)
select public.training_seed_uuid('mvp-path-'||slug),slug,name,promise,description,outcome,120,'intermediate','free',array['free','pro','unlimited'],true,'published',1 from paths
on conflict(slug) do update set name=excluded.name,promise=excluded.promise,description=excluded.description,expected_outcome=excluded.expected_outcome,estimated_minutes=120,minimum_plan='free',status='published';

with modules(path_slug,titles) as (values
 ('construye-una-marca-fuerte',array['Define a quién quieres atraer','Construye tu posicionamiento','Define la personalidad de marca','Crea una propuesta de valor','Evalúa identidades visuales','Aprende los principios de un buen logo','Trabaja tipografía y color','Crea un slogan','Evalúa anuncios','Caso final de marca']),
 ('aprende-a-vender',array['Entender al cliente','Hacer mejores preguntas','Descubrir necesidades','Presentar valor','Manejar objeciones','Defender precio','Hacer seguimiento','Cerrar con claridad','Caso final','Simulación final alternativa'])
), expanded as (
 select p.id path_id,p.slug path_slug,title,ord::int n,
   trim(both '-' from regexp_replace(lower(translate(title,'áéíóúüñ','aeiouun')),'[^a-z0-9]+','-','g')) module_slug
 from modules join public.training_learning_paths p on p.slug=modules.path_slug,
 unnest(modules.titles) with ordinality x(title,ord)
)
insert into public.training_learning_path_modules(id,path_id,slug,title,description,sort_order,estimated_minutes,minimum_plan,allowed_plans,preview_allowed,status)
select public.training_seed_uuid('mvp-module-'||path_slug||'-'||n),path_id,module_slug,title,
 'Módulo práctico para '||lower(title)||' mediante decisiones, aplicación y feedback.',n,12,
 case when n=1 then 'free' else 'pro' end,case when n=1 then array['free','pro','unlimited'] else array['pro','unlimited'] end,n=1,'published'
from expanded on conflict(path_id,sort_order) do update set slug=excluded.slug,title=excluded.title,description=excluded.description,estimated_minutes=excluded.estimated_minutes,minimum_plan=excluded.minimum_plan,allowed_plans=excluded.allowed_plans,preview_allowed=excluded.preview_allowed,status='published';

insert into public.training_path_categories(path_id,category_id)
select p.id,c.id from public.training_learning_paths p join public.training_categories c on
 (p.slug='construye-una-marca-fuerte' and c.slug='marketing-y-marca') or (p.slug='aprende-a-vender' and c.slug='ventas-y-persuasion')
on conflict do nothing;
insert into public.training_path_skills(path_id,skill_id,sort_order)
select p.id,s.id,row_number()over(partition by p.id order by s.created_at,s.id)::int from public.training_learning_paths p
join public.training_categories c on (p.slug='construye-una-marca-fuerte' and c.slug='marketing-y-marca') or (p.slug='aprende-a-vender' and c.slug='ventas-y-persuasion')
join public.training_skills s on s.category_id=c.id and s.status='published' on conflict do nothing;

-- Cada módulo usa cuatro actividades y progresa de reconocimiento a síntesis.
with module_source as (
 select m.id module_id,p.slug path_slug,m.sort_order module_n,
  case p.slug when 'construye-una-marca-fuerte' then 'marketing-y-marca' else 'ventas-y-persuasion' end category_slug
 from public.training_learning_path_modules m join public.training_learning_paths p on p.id=m.path_id
 where p.slug in('construye-una-marca-fuerte','aprende-a-vender')
), ranked as (
 select ms.*,e.id exercise_id,row_number()over(partition by ms.module_id order by md5(e.id::text||ms.module_id::text))::int rn
 from module_source ms join public.training_exercises e on e.skill_id in(select skill_id from training_mvp_matrix where category_slug=ms.category_slug)
 where e.status='published' and e.id in(
   select public.training_seed_uuid('mvp-det-'||category_slug||'-'||n||'-'||variant) from training_mvp_matrix cross join lateral generate_series(1,case when n<=10 then 2 else 1 end)v(variant)
   union all select public.training_seed_uuid('mvp-visual-'||n) from generate_series(1,10)n where ms.category_slug='marketing-y-marca'
   union all select public.training_seed_uuid('mvp-marketing-open-'||n) from generate_series(1,10)n where ms.category_slug='marketing-y-marca'
   union all select public.training_seed_uuid('mvp-sales-message-'||n) from generate_series(1,12)n where ms.category_slug='ventas-y-persuasion'
   union all select public.training_seed_uuid('mvp-sales-open-'||n) from generate_series(1,8)n where ms.category_slug='ventas-y-persuasion'
 )
)
insert into public.training_learning_path_module_items(id,module_id,item_type,exercise_id,sort_order,is_required,unlock_rule,minimum_mastery,minimum_plan,preview_allowed)
select public.training_seed_uuid('mvp-item-'||module_id||'-'||rn),module_id,'exercise',exercise_id,rn,true,
 case when module_n=1 then '{}'::jsonb else jsonb_build_object('previousModuleRequired',true) end,
 case when module_n<=2 then 0 when module_n<=5 then 0.45 when module_n<=8 then 0.6 else 0.7 end,
 case when module_n=1 and rn<=2 then 'free' else 'pro' end,
 module_n=1 and rn<=2
from ranked where rn<=4
on conflict(module_id,sort_order) do update set exercise_id=excluded.exercise_id,item_type='exercise',skill_id=null,concept_id=null,template_id=null,roleplay_scenario_id=null,minimum_mastery=excluded.minimum_mastery,minimum_plan=excluded.minimum_plan,preview_allowed=excluded.preview_allowed;

-- Cuatro escenarios de Ventas listos para revisión editorial, nunca visibles para Free.
with scenarios(slug,title,description,level,character,brief,goal,opening,skills) as (values
 ('mvp-cliente-esceptico','Cliente escéptico','Aclara dudas sin recurrir a presión ni promesas absolutas.','fundamentals','Laura, directora de operaciones','Interesada, analítica y cuidadosa con afirmaciones sin evidencia.','Comprender el escepticismo y acordar una prueba proporcionada.','He escuchado promesas parecidas antes. ¿Qué hace distinta esta propuesta?',array['responder-objeciones']),
 ('mvp-descubrimiento-necesidades','Descubrimiento de necesidades','Practica preguntas abiertas y escucha antes de presentar.','fundamentals','Mateo, responsable de una tienda','Tiene problemas de coordinación, pero aún no los ha priorizado.','Descubrir el problema, su impacto y la urgencia real.','Cuéntame qué necesitas saber sobre nuestra operación.',array['descubrir-necesidades']),
 ('mvp-defensa-precio','Defensa de precio','Conecta alcance, resultado y coste de inacción sin descontar automáticamente.','application','Elena, gerente financiera','Compara tres propuestas y exige claridad de alcance.','Defender precio con valor y concesiones recíprocas.','Su propuesta cuesta más que las otras dos. ¿Por qué debería pagar la diferencia?',array['defender-precio']),
 ('mvp-seguimiento-cierre','Seguimiento y cierre','Retoma una conversación detenida y facilita una decisión.','application','Diego, fundador de una pyme','Mostró interés, pero perdió prioridad entre otras tareas.','Recuperar contexto y acordar un siguiente paso sin perseguir.','Vi tu mensaje. Todavía no he podido revisar la propuesta con mi equipo.',array['escribir-seguimientos','cerrar-con-claridad'])
)
insert into public.training_roleplay_scenarios(id,slug,title,description,category,level,character_name,character_brief,learner_goal,opening_message,is_active,internal_title,public_title,short_description,status,current_version,minimum_plan,estimated_minutes,max_turns,skill_slugs)
select public.training_seed_uuid('roleplay-'||slug),slug,title,description,'Ventas y persuasión',level,character,brief,goal,opening,false,title,title,description,'draft',1,'pro',10,14,skills from scenarios
on conflict(slug) do update set title=excluded.title,description=excluded.description,level=excluded.level,character_name=excluded.character_name,
 character_brief=excluded.character_brief,learner_goal=excluded.learner_goal,opening_message=excluded.opening_message,is_active=false,status='draft',minimum_plan='pro',skill_slugs=excluded.skill_slugs;

-- La función auxiliar permanece disponible para futuras semillas deterministas.
comment on function public.training_seed_uuid(text) is 'Genera UUIDs estables para semillas editoriales idempotentes de Training.';
