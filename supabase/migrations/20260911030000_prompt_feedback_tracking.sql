-- 관리자가 프롬프트 템플릿 "버전별" 평가(session_feedback)를 확인할 수 있게 하기
-- 위한 준비. 배경: .claude/requirements/admin-requirement.md 참고.

-- 리포트 생성 시 어떤 프롬프트 템플릿(버전)이 쓰였는지 기록 - 지금까지는 이 연결이
-- 전혀 없어서 "이 프롬프트 버전이 얼마나 좋은/나쁜 평가를 받았는지"를 집계할 방법이
-- 없었다. 템플릿이 삭제돼도 기존 리포트는 남아야 하므로 on delete set null.
alter table public.reports
  add column prompt_template_id uuid references public.prompt_templates (id) on delete set null;

create index reports_prompt_template_idx on public.reports (prompt_template_id);

-- session_feedback에는 admin 조회 정책이 아예 없었다 - 관리자가 집계하려면 필요.
-- 쓰기 권한은 부여하지 않음(관리자가 사용자 피드백을 대신 남기거나 바꾸지 않음).
create policy "session_feedback: admin 전체 조회"
  on public.session_feedback for select
  using (public.is_admin ());
