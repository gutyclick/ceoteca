-- Users may create only their own adaptive recommendations. Plan and exercise
-- eligibility are still calculated and validated by the server route.
drop policy if exists "training_recommendations_insert_own"
  on public.training_recommendations;

create policy "training_recommendations_insert_own"
  on public.training_recommendations
  for insert
  to authenticated
  with check (auth.uid() = user_id);
