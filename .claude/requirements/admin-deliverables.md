# 管理者向けサービス 開発産出物

브랜치 `feat/admin-service` (PR [#8](https://github.com/jobgogi/madi/pull/8)) 기준,
`main` 대비 변경분 전체 목록. 52 files changed, 1961(+) / 171(-).

## 1. 문서
| 파일 | 내용 |
|---|---|
| `admin-requirement.md` | 요구사항 정의(기능 범위, 라우트 구조, RLS/접근 결정, 미결 사항) |
| `admin-wbs.md` | 작업 분해(Phase 1~5) |
| `admin-integration-test.md` | 통합 테스트 절차/체크리스트 |
| `admin-integration-test-result.md` | 통합 테스트 결과(20항목 전부 PASS) |
| `admin-manual-qa-checklist.md` | 사용자 직접 실행용 단계별 QA 스크립트 |
| `admin-final-report.md` | 최종 종합 테스트 리포트 |
| `.claude/rules/tdd-rule.md` | Red→Green→Refactor 개발 규칙(신규) |
| `.claude/db-design/schema.md` | admin RLS 정책 반영 갱신 |
| `CLAUDE.md` | tdd-rule.md 링크 추가 |

## 2. DB 마이그레이션 (4건, 로컬+production 적용 완료)
| 파일 | 내용 |
|---|---|
| `20260911000000_admin_read_write_policies.sql` | `profiles`/`reports`/`login_history` admin 조회(+profiles 수정) RLS 추가 |
| `20260911010000_seed_prompt_templates.sql` | 기존 하드코딩 프롬프트를 `prompt_templates` v1(활성)로 시드 |
| `20260911020000_lock_prompt_json_rules.sql` | 카테고리/배치처리/출력형식 섹션을 DB content에서 제거(코드로 고정 이전) |
| `20260911030000_prompt_feedback_tracking.sql` | `reports.prompt_template_id` 컬럼 + `session_feedback` admin 조회 정책 |

## 3. 화면 (신규 라우트, 5개)
| 라우트 | 파일 |
|---|---|
| `/admin` (가드+네비) | `app/admin/layout.tsx`, `app/admin/page.tsx` |
| `/admin/prompt-templates` | `page.tsx`, `PromptTemplatesClient.tsx`(작성 폼 + 테스트 실행 패널 + 버전별 피드백 배지) |
| `/admin/error-categories` | `page.tsx` |
| `/admin/users` | `page.tsx` |
| `/admin/stats` | `page.tsx` |

## 4. API 라우트
| 라우트 | 내용 |
|---|---|
| `app/api/admin/prompt-preview/route.ts` (신규) | 관리자 전용 프롬프트 초안 테스트 실행 |
| `app/api/analyze/route.ts` (수정) | DB 활성 템플릿 조회해서 사용 + `promptTemplateId` 응답 포함 |
| `app/api/test-connection/route.ts` (수정) | 공통 요청 파싱 헬퍼로 교체 |

## 5. 데이터 계층 / 훅 (`lib/`)
| 파일 | 내용 |
|---|---|
| `admin-stats.ts` (+test) | 방향별/provider별/일별 가입자 집계 |
| `admin-users.ts` (+test) | 사용자 목록 행 조합(role/가입일/최근 로그인/모국어) |
| `error-categories.ts` | 에러 카테고리 CRUD |
| `prompt-templates.ts` (+test) | 프롬프트 템플릿 CRUD/버전 관리/활성화 전환 |
| `prompt-rules.ts` | `LOCKED_PROMPT_RULES`(고정 규칙, SDK 미의존) |
| `prompt-feedback-stats.ts` (+test) | 템플릿별 good/bad 집계 |
| `providers/analyze.ts` (+test) | `resolvePromptTemplate()`로 전면 개편(하드코딩 프롬프트 제거) |
| `history.ts` | `prompt_template_id` 저장/조회 배선 |
| `hooks/useAdminUsers.ts`, `useErrorCategories.ts`, `usePromptTemplates.ts`, `usePromptFeedbackStats.ts` | 각 화면 데이터 계층 |
| `hooks/useAsyncData.ts` (신규 공통 훅) | fetch-on-mount 패턴 통합 |
| `date-key.ts` (신규 공통 유틸) | `localDateKey()` 중복 제거 |
| `api-request.ts` (신규 공통 유틸) | API 라우트 요청 파싱/rate-limit 보일러플레이트 통합 |

## 6. 기존 코드 수정 (신규 기능 배선 또는 정리)
`app/(app)/history/[id]/page.tsx`(prompt 버전 배지), `app/(app)/new/translate/page.tsx`
(`promptTemplateId` 저장), `lib/dashboard-stats.ts`/`lib/settings.ts`/`lib/severity-style.ts`
(중복 제거·dead code 정리), `lib/hooks/useNativeLanguage.ts`/`useSessionFeedback.ts`/
`useSessions.ts`(공통 훅으로 교체), `.env.example`(`PROMPT_TEST_*` 항목 추가)

## 7. 테스트
단위 테스트 8개 파일 신규(34 테스트, 전부 TDD Red→Green), 통합 테스트 체크리스트
20항목(수동, 전부 PASS) — 상세는 `admin-integration-test-result.md`.

## 8. 배포/PR
* production Supabase: 마이그레이션 4건 반영 완료(`npx supabase db push`, 2026-09-11)
* PR: https://github.com/jobgogi/madi/pull/8 (`feat/admin-service` → `main`, 9개 커밋, 미병합)
* 앱 코드 배포(`npm run deploy`)는 별도 — PR 병합 후 진행
