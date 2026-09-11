# 管理者サービス 統合テスト文書

Phase 3의 4개 화면은 각각 fork(subagent)가 독립적으로 구현하고 단위 테스트(vitest)만
검증했다. 화면 간 연결, RLS 실동작, 전체 빌드는 아직 통합적으로 확인되지 않았으므로
이 문서의 체크리스트로 확인한다. 프로젝트에 e2e 프레임워크(Playwright 등)가 없어
새로 들이지 않고(YAGNI, `basic-rule.md`상 새 라이브러리 도입은 별도 확인 필요) 자동
검증 + 수동 체크리스트로 진행한다.

## 사전 준비
* 로컬 Supabase 실행 확인: `npx supabase status`
* 관리자 계정 1개, 일반 사용자 계정 1개 준비
  * 일반 회원가입 후 로컬 DB에서 직접 role 승격:
    `update public.profiles set role = 'admin' where id = '<user-id>';`
* `npm run dev`로 앱 구동

## 1. 자동 검증 (먼저 실행)
- [X] `npm test` (vitest run) 전체 통과
- [X] `npx tsc --noEmit` 전체 통과
- [X] `npm run build` 성공

## 2. 수동 통합 테스트 체크리스트

### 2-1. 접근 제어 (`app/admin/layout.tsx`)
- [X] 비로그인 상태로 `/admin` 접근 → `/`로 리다이렉트
- [X] 일반 사용자(role=user)로 `/admin` 접근 → `/dashboard`로 리다이렉트
- [X] 관리자(role=admin)로 `/admin` 접근 → 정상 진입, `/admin/prompt-templates`로 리다이렉트

### 2-2. 프롬프트 템플릿 관리
- [X] 방향별(`ja_to_ko`/`ko_to_ja`) 목록이 버전 내림차순으로 표시(v1 시드 템플릿이 활성 배지로 보임)
- [X] 새 버전 작성 후 저장 → `is_active=false`로 생성되는지 DB에서 확인
- [X] 활성화 액션 실행 → 같은 방향의 기존 활성 템플릿이 비활성화되고 신규 템플릿만
      활성화(방향당 active 1개 유지, DB 유니크 인덱스 위반 없음)되는지 확인
- [X] "테스트 실행" 패널에 원문/번역 샘플 입력 → 실제 LLM 호출 결과(난이도/총평/지적 사항)가
      표시되는지 확인 (저장/활성화 전 초안 내용 기준)
- [X] 실제 서비스(`/new` 분석 화면)에서 활성 템플릿 기준으로 분석이 정상 동작하는지 확인
      (더 이상 하드코딩 프롬프트가 아니라 DB 템플릿을 사용하는지가 핵심)

### 2-3. 에러 카테고리 관리
- [X] 10종 코드 전체 목록 표시
- [X] label 인라인 수정 → 저장 성공, 새로고침 후에도 값 유지

### 2-4. 사용자/권한 관리
- [X] 사용자 목록(가입일/최근 로그인) 표시
- [X] role 변경 시 확인 다이얼로그(`confirm`) 동작
- [X] role 변경 후 DB(`profiles.role`)에 실제 반영되는지 확인
- [X] 로그인한 관리자 본인 row는 변경 버튼이 비활성화(disabled) 상태인지 확인

### 2-5. 통계 대시보드
- [X] 전체 가입자 수 / 리포트 수가 DB 직접 카운트(`select count(*) ...`)와 일치
- [X] 방향별(`ja_to_ko`/`ko_to_ja`) · provider별(`claude`/`openai`/`gemini`) 집계가 실제
      데이터와 일치
- [X] 최근 10일 가입 추이 그래프 표시

### 2-6. 크로스커팅
- [X] 네비게이션 4개 탭이 각 화면으로 정상 이동
- [X] "← 서비스로" 링크 → `/dashboard` 이동
- [X] 좁은 화면(모바일 폭)에서 레이아웃 깨짐 없는지

## 3. 알려진 갭 (통합 테스트 실패로 취급하지 않음)
* 에러 카테고리 label 수정이 실제 서비스 화면(`lib/dashboard-stats.ts`의 `CATEGORY_LABEL`
  상수)에는 반영되지 않음 — `admin-requirement.md` 미결 사항, 별도 작업 필요
* 사용자 목록에 이메일 미표시 — `auth.users`가 PostgREST로 노출되지 않고 service role
  키도 프로젝트에 없어 사용자 ID 기준으로만 표시(`lib/admin-users.ts` 설계 판단)

## 완료 기준
1절(자동 검증) + 2절(체크리스트) 전부 통과 시 PR 준비 완료(`git-rule.md`의 "PR 전"
체크리스트로 이어감).
