# 管理者向けサービス要求事項

릴리스 이후 첫 확장 작업. 일반 사용자 화면(`app/(app)`)과 분리된 관리자 전용 화면을 만든다.
아래 범위/구조는 사용자와의 논의로 확정된 1차 안이며, 실제 구현 전 재확인이 필요한 항목은
"미결 사항"에 별도로 남긴다.

## 배경
* DB 스키마(`.claude/db-design/schema.md`, `supabase/migrations/20260908000000_init_schema.sql`)에
  `profiles.role`(`user`/`admin`), `is_admin()` SECURITY DEFINER 함수, `prompt_templates`/
  `error_categories`의 admin 전용 쓰기 RLS 정책이 이미 설계·적용되어 있음.
* 반면 `app/` 쪽에는 관리자 화면이 전혀 없는 상태(완전 신규 작업).

## 1차 기능 범위
1. **프롬프트 템플릿 관리** — `prompt_templates` CRUD, 버전 관리, `is_active` 전환
   (방향당 활성 1개 제약은 DB 유니크 인덱스로 이미 보장됨)
2. **에러 카테고리 라벨 관리** — `error_categories`(10종) label 편집
   (현재 앱 코드는 `lib/dashboard-stats.ts`의 `CATEGORY_LABEL` 상수를 그대로 쓰고 있어
   DB 테이블과 연결되어 있지 않음 — 관리자 화면에서 테이블을 편집 가능하게 해도 코드 쪽
   상수와 별개로 동작한다는 점을 감안해야 함. 실제로 반영하려면 `CATEGORY_LABEL` 참조를
   DB 조회로 바꾸는 별도 작업이 필요 — 이번 범위에는 미포함)
3. **사용자/권한 관리** — `profiles` 목록 조회, `role` 변경(user ↔ admin)
4. **사용 현황/통계 대시보드** — 가입자 수, 리포트 생성량, provider별 사용량 등
   (`reports`, `login_history`, `profiles` 집계)

## 라우트/접근 구조
* `app/(admin)` 라우트 그룹 신설 — 기존 `app/(app)`과 동일한 패턴(그룹 `layout.tsx`에서
  서버 사이드 가드).
* 가드 로직: `app/(app)/layout.tsx`의 로그인 체크 패턴을 따르되, 추가로 `profiles.role`을
  조회해 `admin`이 아니면 리다이렉트.
* URL 경로: `/admin/*` (예: `/admin/prompt-templates`, `/admin/error-categories`,
  `/admin/users`, `/admin/stats`)

## 화면별 요구사항 (초안)
### 프롬프트 템플릿 관리 (`/admin/prompt-templates`)
* 방향(`ja_to_ko`/`ko_to_ja`)별 템플릿 목록, 버전 내림차순
* 새 버전 작성 → 저장 시 `is_active=false`로 생성, "활성화" 액션으로 전환
  (활성화 시 같은 방향의 기존 활성 템플릿은 자동 비활성 — DB 유니크 인덱스가 막으므로
  트랜잭션/RPC로 두 단계 처리 필요)
* 활성 템플릿은 배지로 구분 표시

### 에러 카테고리 관리 (`/admin/error-categories`)
* 10종 코드 고정, label만 인라인 편집
* 코드 추가/삭제는 범위 밖(고정 10종)

### 사용자/권한 관리 (`/admin/users`)
* 이메일, 가입일, role, 최근 로그인 목록
* role 변경은 확인 다이얼로그 필수 (관리자 권한 부여/회수는 민감한 작업)
* 본인 role은 화면에서 변경 불가(자기 자신 강등 방지)

### 사용 현황/통계 대시보드 (`/admin/stats`)
* 전체 가입자 수, 최근 N일 신규 가입 추이
* 전체 리포트 생성량(방향별/provider별)
* 잔디 그래프(`app/(app)/dashboard`)는 개인용이므로 재사용하지 않고, 전체 합산 지표 위주로 구성

## RLS 마이그레이션 결정 (확정, 2026-09-11)
* `reports`/`login_history`: 기존 "본인 것만 조회" 정책은 유지하고, `is_admin()` 기반
  "admin 전체 조회" SELECT 정책을 추가한다 (permissive 정책은 OR로 합산되므로 기존
  정책과 공존 가능 — `prompt_templates`에 이미 쓰인 패턴과 동일). 쓰기 권한은 부여하지
  않음(관리자도 리포트/로그인 이력을 수정·삭제하지 않음).
* `profiles`: 사용자/권한 관리 화면(범위 3번) 구현에 필요하지만 최초 요구사항 문서에서
  누락되어 있었음 — 같은 마이그레이션에 포함. admin 전체 조회 SELECT + admin 전체 수정
  UPDATE 정책을 추가한다(role 변경용). 본인 role 자강등 방지는 DB 정책이 아니라
  애플리케이션(화면) 레벨에서 막는다 — 정책까지 이중으로 걸면 관리자가 실수로 잠기는
  케이스 처리가 복잡해지므로 범위 밖으로 둠.
* 마이그레이션 파일: `supabase/migrations/20260911000000_admin_read_write_policies.sql`

## 접근 방법 (확정, 2026-09-11)
일반 화면(설정/대시보드 등)에 `/admin` 링크를 두지 않기로 함 — 관리자는 URL(`/admin`)을
직접 입력해서 접근한다. 가드(`app/admin/layout.tsx`)가 `profiles.role`을 확인하므로
보안상 문제는 없음, 발견성(진입 링크)만 의도적으로 생략.

## 프롬프트 템플릿 ↔ 실제 분석 파이프라인 연결 (확정·완료, 2026-09-11)
사용자 피드백("기존 프롬프트가 없다", "저장 전 테스트 기능이 없다")으로 발견된 갭 —
`prompt_templates` 화면이 실제로는 아무 효과가 없는 빈 테이블을 관리하고 있었음
(`lib/providers/analyze.ts`의 `buildSystemPrompt()`에 실제 시스템 프롬프트가 하드코딩).
아래처럼 DB를 유일 소스로 전환:
* `lib/providers/analyze.ts`: `buildSystemPrompt()` 제거, 대신 `resolvePromptTemplate(content,
  nativeLanguage)` 순수 함수로 `{{explanationLang}}` 플레이스홀더만 치환. `source`/`target`/
  reading 규칙 등 방향에 따라 달라지는 표현은 방향별 DB 행에 고정 텍스트로 들어있어 별도
  치환 불필요.
* `app/api/analyze/route.ts`: 분석 요청마다 `prompt_templates`에서 해당 방향의 활성
  템플릿을 조회해 시스템 프롬프트로 사용. 활성 템플릿이 없으면 500 에러로 명확히 안내.
* `supabase/migrations/20260911010000_seed_prompt_templates.sql`: 기존 하드코딩 프롬프트를
  v1(활성)으로 두 방향 모두 시드 — 로컬 `supabase db reset`으로 적용·검증 완료(플레이스홀더
  2개씩 정상 포함 확인).
* **테스트 실행(미리보기) 기능** 추가: `app/api/admin/prompt-preview/route.ts`(admin 전용,
  401/403 가드) + `PromptTestPanel`(`app/admin/prompt-templates/PromptTemplatesClient.tsx`) —
  저장/활성화 전 초안 내용으로 실제 LLM을 호출해 원문/번역 샘플에 대한 결과를 미리 확인 가능.
  관리자 본인의 API 키(localStorage) 사용.

## 프롬프트 JSON 관련 규칙 고정 (확정·완료, 2026-09-11)
사용자 피드백("JSON 부분은 아무도 수정 못 하게 하고 싶다")에 따라 프롬프트를 편집 가능
부분과 고정 부분으로 분리:
* `lib/prompt-rules.ts`의 `LOCKED_PROMPT_RULES` — [카테고리 규칙](10종 enum) / [여러 문장
  처리](배치 개수 일치, `assertReportCount`와 직결) / 출력 형식 지시. `lib/providers/analyze.ts`의
  `resolvePromptTemplate()`이 관리자 편집 content 뒤에 항상 자동으로 붙인다. `prompt_templates`
  DB에는 이 세 섹션이 더 이상 들어있지 않음(`20260911020000_lock_prompt_json_rules.sql`로 제거).
* 별도 파일(`lib/prompt-rules.ts`)로 분리한 이유: `lib/providers/analyze.ts`는 서버 전용 LLM
  SDK(Anthropic/OpenAI/Gemini)를 top-level import하므로, 관리자 화면(클라이언트 컴포넌트)에서
  고정 규칙을 읽기 전용으로 보여주려면 SDK가 없는 파일이 필요했음.
* 관리자 화면(`PromptTemplatesClient.tsx`)에 `<details>` 토글로 고정 규칙 본문을 읽기 전용
  표시 — 새로 작성 중인 내용 뒤에 자동으로 뭐가 붙는지 투명하게 보여줌.

## 테스트 실행(미리보기)용 API 키 (확정, 2026-09-11)
일반 사용자 분석 흐름은 BYOK(브라우저 localStorage) 그대로 유지하되, 관리자 전용 테스트
엔드포인트(`app/api/admin/prompt-preview`)는 매번 관리자 개인 키를 요청에 실어 보내는 대신
서버 환경 변수(`PROMPT_TEST_PROVIDER`/`PROMPT_TEST_API_KEY`/`PROMPT_TEST_MODEL`/
`PROMPT_TEST_WORKSPACE_ID`, `.env`)를 사용하도록 변경. `.env`/`.env.example`에 키만 추가해뒀고
실제 값은 사용자가 직접 채워야 함.

## 프롬프트 버전별 평가 추적 (확정·완료, 2026-09-11)
사용자 리포트 화면의 좋아요/싫어요(`session_feedback`)는 이미 구현돼 있었지만, 어떤
리포트가 어떤 프롬프트 템플릿(버전)으로 생성됐는지 기록이 없어 "프롬프트 버전별" 평가
집계가 불가능했음. 아래로 연결:
* `reports.prompt_template_id`(nullable, FK → `prompt_templates.id` on delete set null)
  컬럼 추가 + `session_feedback` admin 조회 정책 추가
  (`20260911030000_prompt_feedback_tracking.sql`).
* `app/api/analyze`가 응답에 `promptTemplateId`를 포함 → `lib/history.ts`의
  `addSession()`이 리포트 저장 시 함께 기록.
* 사용자 리포트 화면(`app/(app)/history/[id]`)에 "prompt v{N}" 배지 표시
  (`lib/history.ts`의 `getSession()`이 `prompt_template_id`로 버전을 조회해 붙임 —
  목록 화면(`loadSessions`)은 항목마다 추가 조회가 필요해 표시하지 않음).
* 관리자 프롬프트 템플릿 화면에 버전별 👍/👎 집계 배지 표시
  (`lib/prompt-feedback-stats.ts`의 `aggregateFeedbackByTemplate()`, TDD로 작성).

## 미결 사항 (남은 것)
* 관리자 계정을 어떻게 최초 지정할지(수동 SQL vs 시드) 미정.
* `error_categories` label 편집이 실제 앱 표시(`CATEGORY_LABEL` 상수)에 반영되지
  않는 갭을 이번 범위에서 해소할지 여부 미정.

## 다음 단계
WBS는 `.claude/requirements/admin-wbs.md` 참고.
