-- profiles: 본인 행 INSERT 정책 추가.
--
-- 배경: profiles 행은 원래 auth.users insert 트리거(handle_new_user)로만
-- 생성된다고 가정해 INSERT 정책을 두지 않았다 (schema.md 참고). 하지만 이
-- 트리거는 "트리거가 생긴 시점 이후" 가입자에게만 적용되므로, 그 이전부터
-- 있던 계정은 profiles 행이 없다. 이 경우 saveNativeLanguage()의
-- UPDATE ... WHERE id = user.id가 대상 행이 없어 에러 없이 조용히
-- 아무것도 안 하는 문제가 있었다 (app/auth/callback/route.ts에서
-- 로그인 직후 upsert로 이 행을 보충한다).
create policy "profiles: 본인 행만 생성"
  on public.profiles for insert
  with check (id = auth.uid ());
