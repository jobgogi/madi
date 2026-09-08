# madi (마디)

일본어를 배우는 한국인, 한국어를 배우는 일본인을 위한 번역 학습 웹앱.
원문을 입력하면 AI가 기준 번역을 만들고, 내 번역과 비교해 문장 단위로
문법·어휘·뉘앙스 차이를 짚어준다.

## 주요 기능

- 원문 입력(단락 구조 유지) → 자동 문장 분리 → 문장별 번역 입력 → 한 번의 배치
  API 호출로 전체 분석
- 문장 단위 비교: 내 번역 vs AI 기준 번역, 문자 단위 diff로 다른 부분 강조
- 의미 왜곡(부정어 누락 등) 우선 감지, 조사·경어·어순 등 10개 카테고리로 분류
- JLPT 레벨 자동 판정, 핵심 단어 정리, 이전 세션 대비 성장 포인트
- 대시보드: 학습 잔디 그래프(365일), 카테고리별 오답 통계
- BYOK(Bring Your Own Key): OpenAI / Claude / Gemini 중 선택, API 키는
  브라우저 localStorage에만 저장되고 분석 요청 시에만 서버로 전달됨
- 한국어/일본어 화면 다국어 지원 (`native_language` 기준, 로그인 전엔
  브라우저 언어 자동 감지)
- Google 로그인(Supabase Auth), 학습 기록은 Supabase DB에 저장

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js (App Router) via vinext |
| 언어 | TypeScript |
| 배포 | vinext → Cloudflare Workers |
| 인증 | Supabase Auth (Google OAuth) |
| 데이터베이스 | Supabase (Postgres) |
| LLM 연동 | BYOK — OpenAI / Claude(Anthropic) / Gemini |
| 스타일 | Tailwind CSS |
| 검증 | Zod |
| 테스트 | Vitest |

## 시작하기

### 준비물

- Node.js 20+
- Supabase 프로젝트 (URL, anon key)
- 직접 테스트해볼 LLM API 키(OpenAI/Claude/Gemini 중 하나, 선택 사항 —
  화면 설정에서 나중에 입력해도 됨)

### 설치

```bash
npm install
cp .env.example .env
# .env에 Supabase URL/anon key 입력
```

### 데이터베이스

스키마/마이그레이션은 `supabase/migrations/`에 있다. 원격 프로젝트에 연결해
적용하려면:

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

테이블 구조와 RLS 정책 설계 배경은 `.claude/db-design/schema.md` 참고.

### 개발 서버

```bash
npm run dev
```

## 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | Cloudflare Worker용 빌드 |
| `npm run start` | 빌드된 Worker를 Wrangler로 로컬 실행 |
| `npm run deploy` | Cloudflare Worker 배포 |
| `npm test` | Vitest 단위 테스트 실행 |

## 프로젝트 구조

```
app/(app)/       로그인 필요 화면 (대시보드/기록/새 학습/설정/온보딩) — 공용 인증 가드
app/api/         API 라우트 (분석 요청 등)
app/auth/        Supabase OAuth 콜백
app/signin/      로그인 화면
lib/             데이터 계층, 커스텀 훅, 프롬프트/스키마, i18n 딕셔너리
components/      공용 UI 컴포넌트
supabase/        마이그레이션(schema)
.claude/         프로젝트 개요/규칙/디자인 요구사항 문서
```

## 참고 문서

- [프로젝트 개요](.claude/project-summary.md)
- [DB 스키마 설계](.claude/db-design/schema.md)
- [디자인 요구사항](.claude/requirements/design-requirement.md)
