# CLAUDE.md

이 파일은 이 저장소에서 작업하는 Claude Code(claude.ai/code)에게 제공하는 가이드입니다.

## 명령어

- `npm run dev` — vinext 개발 서버 실행
- `npm run build` — Cloudflare Worker 산출물 빌드 (`dist/`에 생성)
- `npm run start` — 빌드된 Worker를 `wrangler dev --config dist/server/wrangler.json`으로 로컬 실행 (먼저 `build` 필요)
- `npm run preview` — build 후 start를 한 번에 실행
- `npm run deploy` — `vinext-cloudflare deploy`로 Worker 배포
- `npm run cf-typegen` — `wrangler.jsonc`를 기반으로 `worker-configuration.d.ts`(Cloudflare env/binding 타입) 재생성

아직 lint/test 스크립트는 구성되어 있지 않습니다. 타입 체크는 `npx tsc --noEmit`으로 수행하세요 (기존 `tsconfig.json`은 `noEmit: true`로 설정되어 있습니다).

## 아키텍처

이 프로젝트는 **vinext**(`vinext` + `@vinext/cloudflare`) 앱입니다 — Vite/RSC 위에 구축된 Next.js App Router 호환 프레임워크이며, 배포 대상은 Next.js가 아니라 **Cloudflare Workers**입니다 (`next.config.ts`/`next-env.d.ts`는 타입 호환을 위해서만 존재).

- **라우팅**: `app/` 하위의 파일 기반 라우팅으로 Next.js App Router 규칙을 따름 — 페이지는 `app/<segment>/page.tsx`, API 라우트 핸들러는 `app/api/<segment>/route.ts` (예: `Response`를 반환하는 `export function GET()`), 루트 레이아웃은 `app/layout.tsx`.
- **빌드 파이프라인**: `vite.config.ts`에서 `vinext` 플러그인(Cloudflare CDN 캐시 및 이미지 최적화 어댑터 포함)과 `@cloudflare/vite-plugin`을 함께 연결하며, 빌드를 `rsc`와 `ssr` 두 Vite 환경으로 분리합니다. `vinext build`(`npm run build`)는 `dist/client`(정적 자산)와 `dist/server`(Worker 및 자체 생성된 `wrangler.json`)를 생성합니다.
- **Cloudflare 바인딩**: `wrangler.jsonc`에 선언되어 있음 (assets 바인딩 `ASSETS`, images 바인딩 `IMAGES`, CDN 캐시 활성화). 새 바인딩을 추가하면 `npm run cf-typegen`을 다시 실행해 `worker-configuration.d.ts`의 `CloudflareEnv` 타입을 동기화해야 합니다 — 이 생성 파일은 직접 수정하지 마세요.
- **스타일링**: Tailwind CSS v4를 `@tailwindcss/postcss`로 사용하며, `app/globals.css`에서 한 번만 `@import "tailwindcss"`로 불러옵니다.
- **경로 별칭**: `@/*`는 저장소 루트를 가리킵니다 (`tsconfig.json` 참고).

앱(`madi`) 자체는 아직 초기 단계의 스캐폴드입니다: `app/` 하위 대부분의 라우트(`new`, `history`, `settings`)는 아직 자리표시자(placeholder) 페이지이며, `app/api/analyze/route.ts`가 현재 작업 중인 유일한 실제 API 라우트입니다.
