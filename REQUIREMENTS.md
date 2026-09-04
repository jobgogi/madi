# 마디 — 일한 번역 분석 도구 요구사항 (최종)

> 이전 버전(단순 Gemini 채점 PoC)을 대체하는 최종 요구사항. 이 문서를 기준으로 처음부터 다시 구현한다.

## 프로젝트 개요
일본어 원문과 사용자의 한국어 번역(또는 그 반대 방향)을 AI로 비교 분석하는 개인용 번역 학습 도구.

## 진행 방식
- 이 저장소(madi, vinext + Cloudflare Workers)에서 새로 작성한다 — 기존 madi의 PoC 코드는 재사용하지 않는다.
- 참고 저장소 `../ja-ko-translation-coach` (plain Next.js, localStorage 기반)에 1단계 기능이 이미 구현되어 있음 — **그 코드를 참고해서 빠르게 재작성**한다 (그대로 복사하지 않음, import 경로/런타임을 vinext+Cloudflare Workers에 맞게 이식).
- 이후 신규 기능(2단계) 구현.
- 마지막으로 인증/Supabase 저장/배포(3단계) 진행.

---

## 기술 스택
- 프레임워크: **Next.js (App Router)** 호환 — 실제로는 **vinext**
- 배포: **vinext → Cloudflare Workers** (Cloudflare Pages 아님)
- 인증: Supabase Auth (Google OAuth)
- DB: Supabase (Postgres)
- LLM 연동: BYOK 방식 (Claude/OpenAI/Gemini 어댑터 — Ollama는 스코프 제외, 사용자 확인됨)
  - API 키는 localStorage 저장, 서버 미경유(요청마다 body로 전달, 서버에 영구 저장 안 함)

## 배포 관련 주의사항
- `wrangler versions upload` 전에 반드시 `npm run build`(vinext build) 단계가 선행되어야 함 (Cloudflare 프로젝트 설정의 Build command에 포함)
- `wrangler.jsonc`의 `main` 경로가 vinext 빌드 출력 경로(`fetch-handler` 등)와 일치하는지 확인

---

## 핵심 화면 흐름
```
로그인 → 대시보드(홈) → 입력 화면 → 결과 화면(문장별 순차 표시, 문장 수만큼 API 호출)
→ 저장 → 다음 문장 있으면 결과 화면 반복
→ 모든 문장 완료 시: 여러 문장이었다면 종합 분석 페이지 → 대시보드 / 1문장이면 바로 대시보드
```
- 문장 분리 확인 화면 없음 — 입력 즉시 자동 분리 후 결과 화면에서 바로 순차 진행
- 결과 화면에서 재분석 기능 없음 (한번 저장된 문장별 결과는 그대로 유지, 새로 다시 하려면 `/new`에서 새 학습 시작)

## 대시보드 단계별 기능
- 1단계: 이전 결과 리스트만 표시
- 2단계: 쌓인 데이터를 분석한 통계·강약점 표시 (추후)

---

## 1단계 — 참고 재작성 대상 (`ja-ko-translation-coach` 참고, 새로 작성)

### 오류 카테고리 (10종, 고정)
```
조사_오용, 경어_레벨_오류, 어순_문제, 시제_상_오류, 활용형_오류,
조수사_오류, 어휘_선택_오류, 생략_보충_오류, 문형_오류, 뉘앙스_오류
```
AI 출력의 `category` 값은 반드시 이 10개 중 하나여야 하며, 새 카테고리명 생성 금지.
→ 참고: `src/lib/analysis-schema.ts`의 `POINT_CATEGORIES` (zod enum으로 고정)

### 심각도(severity) 판정 기준
- `critical`: 원문과 반대·왜곡된 의미가 되는 경우 (부정어 누락, 주체/객체 반전 등) — **최우선 감지 규칙**, grammar_points 배열 최상단 배치
- `warning`: 문법 오류 또는 문서 전체 어조·시제 일관성을 깨는 경우
- `info`: 문법은 맞지만 더 자연스러운 표현이 있는 경우 (직역투 등)
→ 참고: `src/lib/severity-style.ts`, `analysis-schema.ts`의 `SEVERITIES`

### 설정 화면
- LLM 제공자 선택 드롭다운(Claude/OpenAI/Gemini)에 따라 하단 필드 동적 전환 (Claude만 Workspace ID 필드 노출)
- API 키는 localStorage에만 저장
→ 참고: `src/lib/settings.ts` (Ollama는 스코프 제외 확정 — 참고 저장소와 동일하게 claude/openai/gemini 3종)

### 에러 케이스별 안내 문구
| 상황 | 문구 |
|---|---|
| 키 미입력 | API 키가 설정되지 않았습니다. 설정 화면에서 먼저 입력해주세요. |
| 키 인증 실패 | API 키가 유효하지 않습니다. 키가 만료되었거나 잘못 입력되었을 수 있습니다. |
| 키 사용량 초과 | API 사용량 한도에 도달했습니다. 잠시 후 다시 시도하거나 사용량을 확인해주세요. |
| 네트워크 실패 | 네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요. |
| AI 응답 파싱 오류 | AI 응답을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요. (재시도 버튼) |
| 저장 실패 | 결과 저장에 실패했습니다. 분석 결과는 화면에 유지되니, 다시 저장을 시도해주세요. |
| 세션 만료 | 로그인이 만료되었습니다. 다시 로그인해주세요. (3단계 인증 추가 후 적용) |
→ 참고: `src/lib/providers/errors.ts`의 `describeProviderError` (Ollama/CORS 케이스는 스코프 제외, 세션 만료는 3단계 인증 추가 시 적용)

### 종합 분석 페이지 (여러 문장일 때만 등장)
- 등장 시점: 결과 화면(마지막 문장) → 저장 → **종합 분석 페이지** → 대시보드
- 문장 1개면 생략, 바로 대시보드로
- 포함 내용: 전체 오류 통계(카테고리별 건수), 심각도 분포, 전체 총평, 문단 단위 diff(원문/내 번역/AI 번역 전체 비교, 펼쳐보기), JLPT 난이도 분포 및 최고난도 문장 하이라이트
- 추가 LLM API 호출 없이, 이미 저장된 문장별 데이터를 **클라이언트에서 집계**만 함
→ 참고: `src/lib/session-summary.ts` (카테고리/심각도/JLPT 집계), `src/lib/diff.ts` (문자 단위 LCS diff)

### 기타 참고 파일
- `src/lib/sentence-split.ts` — 문장 분리 + 원문/번역 문장 짝짓기 (개수 안 맞으면 통째로 1쌍 처리)
- `src/lib/jlpt-style.ts` — JLPT 등급 배지 색상
- `src/lib/rate-limit.ts` — 서버 인스턴스 메모리 슬라이딩 윈도우 레이트리밋 (Cloudflare Workers는 인스턴스가 매 요청 새로 뜰 수 있어 그대로 안 맞을 수 있음 — 재검토 필요)
- `src/app/api/analyze/route.ts`, `src/lib/providers/analyze.ts` — provider별 어댑터 + zod 구조화 출력
- `src/components/AnalysisReportView.tsx`, `TranslationComparison.tsx`, `SessionCard.tsx` — 결과/이력 UI 컴포넌트

---

## 2단계 — 신규 구현

### 방향 전환 (일→한 / 한→일)
- `sessions.direction` 필드 추가 (`ja_to_ko` / `ko_to_ja`)
- 입력 화면에 방향 토글 UI
- 방향에 따라 원문/번역 언어 라벨 자동 전환
- `ko_to_ja`일 때: AI가 먼저 일본어 기준 번역 생성 → 그 번역을 기준으로 사용자의 일본어 평가
- 난이도(JLPT) 판정은 방향과 무관하게 항상 "최종 일본어 결과물" 기준으로 통일

### 가타카나 발음 표기
- `ja_to_ko`: 일본어 단어 → 후리가나(히라가나) 표기
- `ko_to_ja`: 한국어 단어 → 가타카나 발음 표기 (외래어 표기법 기준 규칙을 프롬프트에 명시하여 일관성 확보)
- `vocabulary_diff[].reading` 필드에 방향별로 채움

---

## 3단계 — 인증/저장/배포

### Supabase 연동
- Auth: Google OAuth
- DB 핵심 테이블
  - `documents`: 긴 글 원본 (id, user_id, title, full_text, created_at)
  - `sessions`: 문장 단위 세션 (source_text, user_translation, ai_translation, overall_evaluation, jlpt_level_estimated, jlpt_reason, llm_provider, llm_model, prompt_version, parent_session_id, document_id, sentence_order, direction, created_at)
  - `grammar_points`: (session_id, category_id, severity, description, example)
  - `vocabulary_items`: (session_id, word, reading, meaning, note)
  - `error_categories`: (id, name, description) — 10종 고정
- RLS 정책: 로그인한 본인 데이터만 읽기/쓰기 가능하도록 설정

### vinext + Cloudflare Workers 배포
- 위 "배포 관련 주의사항" 참고

---

## AI 프롬프트 설계 원칙

### 지시 순서
```
1단계 - 원문 전체(문맥 포함)를 참고하여 "분석 대상 문장"을 먼저 정확하게 번역한다 (이것이 평가 기준선이 된다)
2단계 - 1단계 번역을 기준 삼아 사용자 번역과 비교 분석한다
3단계 - 원문 문장의 난이도(JLPT 기준)를 판정하고 근거를 함께 제시한다
```

### 최우선 규칙 — 의미 왜곡 감지
다른 무엇보다 먼저, 부정어 누락/추가나 주체·객체 반전처럼 원문과 반대 의미가 되는 오류를 검사하고, 발견 시 반드시 `severity: "critical"`로 표시하며 `grammar_points` 배열의 첫 항목으로 배치한다. 문장이 자연스럽게 읽혀도 의미 왜곡은 반드시 지적한다.

### 핵심 단어 선정 기준
1순위: 사용자가 오역·오용한 단어 / 2순위: 원문의 핵심 전문용어

### 출력 형식
반드시 아래 JSON 스키마로만 응답, 다른 설명 텍스트 금지.

```json
{
  "jlpt_level": "N3",
  "jlpt_reason": "판정 근거",
  "ai_translation": "AI가 만든 기준 번역",
  "comparison": {
    "vocabulary_diff": [{"word": "", "reading": "", "user_usage": "", "ai_usage": "", "note": ""}],
    "grammar_points": [{"category": "", "severity": "critical|warning|info", "description": "", "user_text": "", "suggestion": ""}],
    "nuance_diff": ""
  },
  "overall_evaluation": ""
}
```

> 참고 저장소의 `analysis-schema.ts`는 이 스키마를 zod로 이미 구현해 두었으나 필드명이 다르다(`difficulty.level/comment`, `grammar_points[].source_expression/user_expression/comment/suggestion`, `suggested_translations`). 이식 시 위 최종 스키마 기준으로 필드명을 맞출지, 기존 zod 스키마를 그대로 쓸지 결정 필요.

---

## API 호출 방식 인지사항
- 문장 수만큼 API 호출이 반복됨 (원문 전체를 매번 함께 전송)
- 현재는 최적화 없이 진행, 입력 화면에 "긴 글은 문장 수만큼 API 요청이 발생합니다" 안내 문구만 추가
- Claude API 사용 시 prompt caching은 향후 검토 대상

---

## UI 구현 원칙
- 카드 기반, 미니멀 스타일, 반응형, 모든 비동기 작업에 로딩/에러 상태 표시
- severity는 색상 + 텍스트 라벨로 함께 표시 (색상만으로 구분 금지), critical 최상단 고정
- 진행률 표시("2/5 문장")는 문장이 2개 이상일 때만
- 접근성: 모든 인터랙티브 요소에 aria-label
