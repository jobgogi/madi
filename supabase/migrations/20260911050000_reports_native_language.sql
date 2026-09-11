-- 리포트 생성 당시 사용자의 모국어(설명 텍스트 언어)를 기록해 기록 화면에 표시할
-- 수 있게 한다. direction만으로는 알 수 없다 - 사용자가 방향을 수동으로 바꿔도
-- 설명 텍스트는 항상 그 시점의 모국어로 작성되기 때문(lib/providers/analyze.ts
-- 참고). 기존 리포트는 이 값이 없었으므로 nullable로 두고 기록 화면에서는
-- null이면 "-"로 표시한다(과거 값을 direction으로 추측해서 채우지 않음).
alter table public.reports
  add column native_language text check (native_language in ('ko', 'ja'));
