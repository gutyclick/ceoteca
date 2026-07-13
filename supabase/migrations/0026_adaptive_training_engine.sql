create table if not exists public.training_skill_prerequisites(skill_id uuid not null references public.training_skills on delete cascade,prerequisite_skill_id uuid not null references public.training_skills on delete cascade,minimum_mastery numeric not null default 60 check(minimum_mastery between 0 and 100),created_at timestamptz not null default now(),primary key(skill_id,prerequisite_skill_id),check(skill_id<>prerequisite_skill_id));
create table if not exists public.training_concept_prerequisites(concept_id uuid not null references public.training_concepts on delete cascade,prerequisite_concept_id uuid not null references public.training_concepts on delete cascade,minimum_mastery numeric not null default 60 check(minimum_mastery between 0 and 100),created_at timestamptz not null default now(),primary key(concept_id,prerequisite_concept_id),check(concept_id<>prerequisite_concept_id));
create table if not exists public.user_training_preferences(user_id uuid primary key references auth.users on delete cascade,preferred_duration_minutes integer not null default 7 check(preferred_duration_minutes in(3,5,7,10,15)),preferred_exercise_types text[] not null default '{}',disliked_exercise_types text[] not null default '{}',difficulty_preference text,ai_evaluation_preference text not null default 'ask' check(ai_evaluation_preference in('ask','when_useful','never')),daily_goal_minutes integer not null default 7 check(daily_goal_minutes between 1 and 120),created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table if not exists public.training_recommendations(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,generated_session_id uuid references public.training_sessions on delete set null,recommendation_type text not null default 'adaptive',primary_skill_id uuid references public.training_skills,secondary_skill_ids uuid[] not null default '{}',selected_concept_ids uuid[] not null default '{}',selected_exercise_ids uuid[] not null default '{}',requested_duration_minutes integer not null,calculated_duration_minutes integer not null,priority_snapshot jsonb not null default '{}',explanation jsonb not null,includes_deep_ai_evaluation boolean not null default false,status text not null default 'generated' check(status in('generated','accepted','dismissed','expired','converted')),idempotency_key text not null,expires_at timestamptz not null,created_at timestamptz not null default now(),accepted_at timestamptz,dismissed_at timestamptz,unique(user_id,idempotency_key));
create index if not exists training_recommendations_user_status_idx on public.training_recommendations(user_id,status,expires_at);
alter table public.user_training_preferences enable row level security;
alter table public.training_recommendations enable row level security;
alter table public.training_skill_prerequisites enable row level security;
alter table public.training_concept_prerequisites enable row level security;
create policy "training_preferences_own" on public.user_training_preferences for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "training_recommendations_select_own" on public.training_recommendations for select using(auth.uid()=user_id);
create policy "training_recommendations_update_own" on public.training_recommendations for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "training_skill_prerequisites_read" on public.training_skill_prerequisites for select to authenticated using(true);
create policy "training_concept_prerequisites_read" on public.training_concept_prerequisites for select to authenticated using(true);

-- Count only valid provider feedback. Fallbacks, failures and pending requests do not consume quota.
create or replace function public.get_training_ai_monthly_usage(p_user_id uuid,p_month date) returns integer language sql stable security definer set search_path=public as $$ select count(*)::integer from training_ai_evaluations where user_id=p_user_id and status='completed' and provider='openai' and created_at>=date_trunc('month',p_month)::timestamptz and created_at<(date_trunc('month',p_month)+interval '1 month')::timestamptz $$;
revoke all on function public.get_training_ai_monthly_usage(uuid,date) from public;
grant execute on function public.get_training_ai_monthly_usage(uuid,date) to authenticated;

do $$ declare basic_skill uuid; advanced_skill uuid; basic_concept uuid; advanced_concept uuid; begin
 select id into basic_skill from training_skills where slug='propuesta-de-valor';
 insert into training_skills(category_id,slug,name,description,initial_difficulty) select category_id,'validacion-avanzada','Validación avanzada','Diseña pruebas de mercado con evidencia.','advanced' from training_skills where id=basic_skill on conflict(slug) do update set name=excluded.name returning id into advanced_skill;
 select id into basic_concept from training_concepts where skill_id=basic_skill order by created_at limit 1;
 insert into training_concepts(skill_id,slug,name,description,difficulty) values(advanced_skill,'evidencia-de-mercado','Evidencia de mercado','Distingue opinión de comportamiento verificable.','advanced') on conflict(slug) do update set name=excluded.name returning id into advanced_concept;
 insert into training_skill_prerequisites(skill_id,prerequisite_skill_id,minimum_mastery) values(advanced_skill,basic_skill,60) on conflict do nothing;
 insert into training_concept_prerequisites(concept_id,prerequisite_concept_id,minimum_mastery) values(advanced_concept,basic_concept,60) on conflict do nothing;
end $$;

create or replace function public.accept_adaptive_training_recommendation(p_recommendation_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_rec training_recommendations; v_session uuid; v_count integer;
begin
 if v_user is null then raise exception 'unauthenticated'; end if;
 select * into v_rec from training_recommendations where id=p_recommendation_id and user_id=v_user and status in('generated','accepted') and expires_at>now() for update;
 if v_rec.id is null then raise exception 'recommendation_not_found'; end if;
 if v_rec.generated_session_id is not null then return v_rec.generated_session_id; end if;
 v_count:=cardinality(v_rec.selected_exercise_ids);
 insert into training_sessions(user_id,title,total_exercises,estimated_minutes,status) values(v_user,'Entrenamiento adaptativo',v_count,v_rec.calculated_duration_minutes,'not_started') returning id into v_session;
 insert into training_session_exercises(session_id,exercise_id,position,exercise_snapshot)
 select v_session,e.id,u.ordinality,jsonb_build_object('id',e.id,'type',e.type,'title',e.title,'prompt',e.prompt,'instruction',e.instruction,'difficulty',e.difficulty,'estimatedSeconds',e.estimated_seconds,'hint',e.hint,'explanation',e.explanation,'content',e.content,'skillId',e.skill_id,'conceptId',e.concept_id,'minimumLength',e.minimum_response_length,'maximumLength',e.maximum_response_length,'allowRevision',e.allow_revision,'maxRevisions',e.max_revisions)
 from unnest(v_rec.selected_exercise_ids) with ordinality u(id,ordinality) join training_exercises e on e.id=u.id where e.status='published' order by u.ordinality;
 update training_recommendations set generated_session_id=v_session,status='converted',accepted_at=coalesce(accepted_at,now()) where id=v_rec.id;
 return v_session;
end $$;
revoke all on function public.accept_adaptive_training_recommendation(uuid) from public;
grant execute on function public.accept_adaptive_training_recommendation(uuid) to authenticated;
