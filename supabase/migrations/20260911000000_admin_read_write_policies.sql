-- 관리자 화면(사용자 관리, 사용 현황 통계)을 위한 admin 조회/수정 정책 추가.
-- 배경: .claude/requirements/admin-requirement.md, .claude/db-design/schema.md 참고.
-- 기존 "본인 것만" 정책은 그대로 두고, is_admin() 기반 permissive 정책을 추가로 얹는다
-- (permissive 정책은 OR로 합산되므로 prompt_templates에 이미 쓰인 패턴과 동일).

create policy "profiles: admin 전체 조회"
  on public.profiles for select
  using (public.is_admin ());

create policy "profiles: admin 전체 수정"
  on public.profiles for update
  using (public.is_admin ())
  with check (public.is_admin ());

create policy "reports: admin 전체 조회"
  on public.reports for select
  using (public.is_admin ());

create policy "login_history: admin 전체 조회"
  on public.login_history for select
  using (public.is_admin ());
