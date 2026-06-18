-- Answer keys are stored outside the API-exposed schemas and are readable only
-- through a service-role RPC used by the quiz Edge Function.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.quiz_questions (
  subject_code text not null,
  question_id integer not null,
  topic text not null,
  question text not null,
  options jsonb not null,
  answer text not null,
  sort_order integer not null,
  primary key (subject_code, question_id),
  check (jsonb_typeof(options) = 'array'),
  check (jsonb_array_length(options) >= 2)
);

revoke all on private.quiz_questions from public, anon, authenticated;

create or replace function public.get_private_quiz_bank(p_subject text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.question_id,
        'topic', q.topic,
        'question', q.question,
        'options', q.options,
        'answer', q.answer
      ) order by q.sort_order
    ),
    '[]'::jsonb
  )
  from private.quiz_questions as q
  where q.subject_code = upper(trim(p_subject));
$$;

revoke all on function public.get_private_quiz_bank(text)
  from public, anon, authenticated;
grant execute on function public.get_private_quiz_bank(text) to service_role;
