-- madi DB 스키마 초기 마이그레이션.
-- 설계 배경/ER 다이어그램/알려진 갭은 .claude/db-design/schema.md 참고.
--
-- 절대 규칙: LLM API 키는 어떤 테이블에도 저장하지 않는다.
-- (브라우저 localStorage에만 보관, 분석 요청 시에만 서버로 전달)

-- =========================================================
-- profiles
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  -- 온보딩(/onboarding/language)에서 선택한 모국어. 현재 앱은 이 컬럼을
  -- 쓰지 않고 localStorage(madi:native-language)만 사용 — schema.md 참고.
  native_language text check (native_language in ('ko', 'ja')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: 본인 행만 조회"
  on public.profiles for select
  using (id = auth.uid ());

create policy "profiles: 본인 행만 수정"
  on public.profiles for update
  using (id = auth.uid ())
  with check (id = auth.uid ());

-- auth.users에 새 사용자가 생기면 profiles 행을 자동 생성.
create function public.handle_new_user () returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user ();

-- =========================================================
-- is_admin() — RLS 정책에서 profiles.role을 재귀 없이 확인하기 위한 헬퍼.
-- =========================================================
create function public.is_admin () returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =========================================================
-- reports
-- =========================================================
create table public.reports (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('ja_to_ko', 'ko_to_ja')),
  provider text not null check (provider in ('claude', 'openai', 'gemini')),
  schema_version smallint not null default 3,
  -- SentenceResult[] (lib/history.ts): { sourceText, userTranslation,
  -- report: TranslationAnalysisReport (lib/analysis-schema.ts), durationMs? }
  sentences jsonb not null,
  created_at timestamptz not null default now()
);

create index reports_user_created_idx on public.reports (user_id, created_at desc);

create index reports_user_direction_created_idx on public.reports (user_id, direction, created_at desc);

alter table public.reports enable row level security;

create policy "reports: 본인 것만 조회"
  on public.reports for select
  using (user_id = auth.uid ());

create policy "reports: 본인 것만 생성"
  on public.reports for insert
  with check (user_id = auth.uid ());

create policy "reports: 본인 것만 삭제"
  on public.reports for delete using (user_id = auth.uid ());

-- =========================================================
-- session_feedback
-- =========================================================
create table public.session_feedback (
  id uuid primary key default gen_random_uuid (),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  feedback text not null check (feedback in ('good', 'bad')),
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

alter table public.session_feedback enable row level security;

create policy "session_feedback: 본인 것만 조회"
  on public.session_feedback for select
  using (user_id = auth.uid ());

create policy "session_feedback: 본인 리포트에만 생성"
  on public.session_feedback for insert
  with check (
    user_id = auth.uid ()
    and exists (
      select 1
      from public.reports
      where id = report_id and user_id = auth.uid ()
    )
  );

create policy "session_feedback: 본인 것만 삭제"
  on public.session_feedback for delete using (user_id = auth.uid ());

-- =========================================================
-- login_history
-- =========================================================
create table public.login_history (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  logged_in_at timestamptz not null default now()
);

create index login_history_user_idx on public.login_history (user_id, logged_in_at desc);

alter table public.login_history enable row level security;

create policy "login_history: 본인 것만 조회"
  on public.login_history for select
  using (user_id = auth.uid ());

create policy "login_history: 본인 것만 생성"
  on public.login_history for insert
  with check (user_id = auth.uid ());

-- =========================================================
-- prompt_templates
-- =========================================================
create table public.prompt_templates (
  id uuid primary key default gen_random_uuid (),
  direction text not null check (direction in ('ja_to_ko', 'ko_to_ja')),
  version int not null,
  content text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (direction, version)
);

-- 방향당 활성 템플릿은 최대 1개.
create unique index prompt_templates_one_active_per_direction on public.prompt_templates (direction) where is_active;

alter table public.prompt_templates enable row level security;

create policy "prompt_templates: 인증 사용자 전체 조회"
  on public.prompt_templates for select
  to authenticated using (true);

create policy "prompt_templates: admin만 쓰기"
  on public.prompt_templates for all
  using (public.is_admin ())
  with check (public.is_admin ());

-- =========================================================
-- error_categories
-- =========================================================
create table public.error_categories (
  code text primary key,
  label text not null
);

alter table public.error_categories enable row level security;

create policy "error_categories: 전체 조회(익명 포함)"
  on public.error_categories for select
  using (true);

create policy "error_categories: admin만 쓰기"
  on public.error_categories for all
  using (public.is_admin ())
  with check (public.is_admin ());

-- lib/analysis-schema.ts의 POINT_CATEGORIES + dashboard-stats.ts의 CATEGORY_LABEL 그대로 시드.
insert into
  public.error_categories (code, label)
values
  ('조사_오용', '조사 오용'),
  ('경어_레벨_오류', '경어 레벨 오류'),
  ('어순_문제', '어순 문제'),
  ('시제_상_오류', '시제·상 오류'),
  ('활용형_오류', '활용형 오류'),
  ('조수사_오류', '조수사 오류'),
  ('어휘_선택_오류', '어휘 선택 오류'),
  ('생략_보충_오류', '생략·보충 오류'),
  ('문형_오류', '문형 오류'),
  ('뉘앙스_오류', '뉘앙스 오류');
