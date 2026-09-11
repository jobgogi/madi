-- session_feedback에 UPDATE 정책이 없어서 발생한 버그 수정.
-- lib/session-feedback.ts의 setFeedback()이 upsert(...).onConflict("report_id,user_id")를
-- 쓰는데, 이미 같은 (report_id, user_id) 행이 있으면 upsert가 내부적으로 UPDATE 경로를
-- 타고, UPDATE 정책이 없으면 RLS가 "new row violates row-level security policy (USING
-- expression) for table session_feedback"로 막는다 (최초 스키마 20260908000000부터
-- 있던 버그, insert/select/delete 정책만 있고 update가 빠져 있었음).

create policy "session_feedback: 본인 것만 수정"
  on public.session_feedback for update
  using (user_id = auth.uid ())
  with check (user_id = auth.uid ());
