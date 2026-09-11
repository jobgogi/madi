# 管理者向けサービス WBS

`.claude/requirements/admin-requirement.md` 기능 범위를 작업 단위로 분해한 것.
괄호 안은 예상 산출물(파일). "병렬"로 표시된 항목은 선행 Phase만 끝나면 서로 의존성 없이
동시 진행 가능 — 이 경우 subagent(fork)로 분리 실행한다.

## Phase 1 — DB: RLS 마이그레이션 (완료·검증됨)
* `profiles`/`reports`/`login_history`에 admin 전체 조회(+profiles는 수정) 정책 추가
* 산출물: `supabase/migrations/20260911000000_admin_read_write_policies.sql`
* 검증: 로컬 `supabase db reset` 적용 후 `pg_policies`로 정책 12개 생성 확인 완료

## Phase 2 — 공통 기반 (완료)
Phase 3의 모든 화면이 공유. 직접 처리 완료.

1. ~~`app/(admin)` 라우트 그룹~~ → **`app/admin/` 일반 폴더**로 구현 (route group `(admin)`은
   URL에 세그먼트를 안 붙이므로 `/admin/*` prefix를 만들려면 그냥 `app/admin/` 폴더가 맞음 —
   최초 문서의 "라우트 그룹" 표현은 부정확했으므로 정정)
   * `app/admin/layout.tsx` — 로그인 체크 + `profiles.role === 'admin'` 체크, 아니면
     `/dashboard`로 리다이렉트. 네비게이션(탭 4개 + "서비스로" 링크) 포함.
   * `app/admin/page.tsx` — `/admin` 접속 시 `/admin/prompt-templates`로 리다이렉트
2. 관리자 여부 조회는 레이아웃(서버 컴포넌트)에서 이미 처리하므로 별도 `useIsAdmin` 훅은
   만들지 않음(YAGNI) — Phase 3 화면들은 레이아웃 안쪽이라 이미 admin으로 보장됨
3. 공통 네비게이션은 레이아웃에 포함 완료. Phase 3 각 화면은 자기 라우트 디렉터리 안에서만
   작업(`app/admin/prompt-templates/`, `app/admin/error-categories/`, `app/admin/users/`,
   `app/admin/stats/`) — nav를 건드릴 필요 없음(이미 4개 탭 다 있음)

## Phase 3 — 화면 구현 (Phase 2 완료 후 병렬 가능, subagent 4개로 분리)
| # | 화면 | 산출물 | 비고 |
|---|---|---|---|
| 3-1 | 프롬프트 템플릿 관리 | `app/(admin)/prompt-templates/*`, `lib/hooks/usePromptTemplates.ts` | 활성화 전환은 RPC/트랜잭션 필요(같은 방향 기존 활성 비활성화 후 신규 활성화) |
| 3-2 | 에러 카테고리 관리 | `app/(admin)/error-categories/*`, `lib/hooks/useErrorCategories.ts` | label 인라인 편집만, 코드 추가/삭제 없음 |
| 3-3 | 사용자/권한 관리 | `app/(admin)/users/*`, `lib/hooks/useAdminUsers.ts` | role 변경 확인 다이얼로그, 본인 row는 변경 버튼 비활성화 |
| 3-4 | 사용 현황 통계 대시보드 | `app/(admin)/stats/*`, `lib/admin-stats.ts`(집계 순수 함수 + 테스트) | 가입자 수/추이, 리포트 생성량(방향·provider별) |

병렬 실행 시 서로 다른 디렉터리/파일만 건드리므로 충돌 없음. 단, 4개 모두 Phase 2의
공통 셸/네비게이션에 탭을 추가하므로 그 파일(예: 공통 nav 컴포넌트)만 병합 시 충돌
가능성 있음 — 병렬 착수 전 nav 항목은 Phase 2에서 4개 다 미리 비워두고 각 화면은
자기 라우트 디렉터리 안에서만 작업하도록 범위를 제한한다.

순수 함수는 `.claude/rules/tdd-rule.md`(Red→Green→Refactor)를 따른다.

## Phase 4 — 테스트/검증
* 순수 함수(`lib/admin-stats.ts` 등)는 `working-rule.md`/`tdd-rule.md`에 따라 단위 테스트 필수
* 각 화면 RLS 동작 확인(비관리자 계정으로 `/admin/*` 접근 시 리다이렉트 확인)
* `npm run build` / `vitest` 통과 확인

## Phase 5 — PR
* `git-rule.md` 규칙대로 기능 단위 커밋 분리(가능하면 Phase별 또는 화면별 커밋)
* PR 설명에 이 WBS/requirement 문서 링크

## 진행 방식
* Phase 1(완료), Phase 2(완료) — 직접 순차 진행.
* Phase 3은 4개 subagent(fork)로 동시 착수함(2026-09-11) — 각 fork에 화면별 범위,
  참고 문서 경로, tdd-rule 적용 대상을 전달하고 공용 파일(레이아웃/다른 화면)은
  건드리지 않도록 지시. 완료 후 결과 리뷰·타입체크·빌드 확인은 별도로 진행.
