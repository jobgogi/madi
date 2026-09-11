# 管理者サービス — 直接テストチェックリスト（ユーザー実行用）

`admin-integration-test-result.md`의 B1~B18을 사용자가 브라우저로 직접 클릭해가며
확인할 수 있도록 단계별 절차로 풀어놓은 문서. 진행하면서 각 항목의 결과를
`admin-integration-test-result.md`의 상태 칸(PASS/FAIL)에 옮겨 적으면 된다.

## 사전 준비
1. 로컬 Supabase 실행 확인: `npx supabase status` (안 떠 있으면 `npx supabase start`)
2. `npm run dev` 실행
3. 테스트용 계정 2개 준비
   * 일반 계정 A (role='user', 그대로 둠)
   * 관리자 계정 B — 회원가입 후 아래 SQL로 승격
     ```sql
     update public.profiles set role = 'admin' where id = '<B의 user id>';
     ```

## 1. 접근 제어 (B1~B3)
1. 브라우저 시크릿창(비로그인)에서 `/admin` 접속 → **B1**: `/`(랜딩)로 리다이렉트되는지 확인
2. 계정 A(일반 사용자)로 로그인 후 `/admin` 접속 → **B2**: `/dashboard`로 리다이렉트되는지 확인
3. 계정 B(관리자)로 로그인 후 `/admin` 접속 → **B3**: `/admin/prompt-templates`로 자동 이동하는지 확인

## 2. 프롬프트 템플릿 관리 (B4~B6) — `/admin/prompt-templates`
1. 방향(ja_to_ko/ko_to_ja) 목록이 **버전 내림차순**으로 보이는지 확인 → **B4**
2. 새 템플릿 내용을 입력하고 저장 → Supabase Studio(`http://127.0.0.1:54323`)에서
   `prompt_templates` 테이블 열어 방금 만든 행의 `is_active`가 `false`인지 확인 → **B5**
3. 방금 만든 템플릿을 "활성화" → 같은 방향의 기존 활성 템플릿이 자동으로 꺼지고
   새 템플릿만 켜지는지 화면 배지 + Studio에서 확인 → **B6**

## 3. 에러 카테고리 관리 (B7~B8) — `/admin/error-categories`
1. 10개 카테고리가 전부 보이는지 확인 → **B7**
2. 아무 label이나 수정 후 저장 → 브라우저 새로고침(F5) 했을 때도 바뀐 값이 유지되는지 확인 → **B8**

## 4. 사용자/권한 관리 (B9~B12) — `/admin/users`
1. 가입일/최근 로그인이 표시되는지 확인 → **B9**
2. 계정 A의 role 변경 버튼 클릭 → 확인창(`확인/취소`)이 뜨는지 확인 → **B10**
3. 확인을 눌러 role 변경 → Studio에서 `profiles.role`이 바뀌었는지 확인 → **B11**
4. 지금 로그인한 계정 B(본인) row의 변경 버튼이 비활성화(회색, 클릭 안 됨)인지 확인 → **B12**

## 5. 통계 대시보드 (B13~B15) — `/admin/stats`
1. 화면의 "전체 가입자 수"/"전체 리포트 수"를 Studio에서 직접
   `select count(*) from profiles;` / `select count(*) from reports;`로 비교 → **B13**
2. 방향별(ja_to_ko/ko_to_ja)·provider별(claude/openai/gemini) 숫자가 실제 데이터와
   맞는지 확인 → **B14**
3. 최근 10일 가입 추이 그래프(막대 아래 시작/종료 날짜 표시)가 표시되는지 확인 → **B15**

## 6. 크로스커팅 (B16~B18)
1. 상단 네비게이션 4개 탭을 순서대로 클릭 — 각각 해당 화면으로 이동하는지 확인 → **B16**
2. "← 서비스로" 링크 클릭 → `/dashboard`로 이동하는지 확인 → **B17**
3. 브라우저 창을 모바일 폭(예: 375px)으로 줄여서 각 화면이 깨지지 않는지 확인 → **B18**

## 완료 후
결과를 `admin-integration-test-result.md`의 표에 옮겨 적고, FAIL 항목이 있으면
알려주시면 바로 고치겠습니다.
