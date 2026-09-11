import type { NativeLanguage } from "@/lib/native-language";

export const settingsText: Record<
  NativeLanguage,
  {
    back: string;
    title: string;
    languageLabel: string;
    languageGroupAriaLabel: string;
    languageHint: string;
    uiLanguageLabel: string;
    uiLanguageGroupAriaLabel: string;
    uiLanguageHint: string;
    aiModelTitle: string;
    apiKeyIntro: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    geminiGuideSummary: string;
    geminiGuideStep1Rest: string;
    geminiGuideSteps: string[];
    geminiGuideCaution: string;
    modelLabel: string;
    modelPlaceholder: string;
    onboardingApiKeyTitle: string;
    onboardingApiKeySubtitle: string;
    save: string;
    testConnection: string;
    testing: string;
    testSuccess: string;
    signOut: string;
    signingOut: string;
  }
> = {
  ko: {
    back: "← 돌아가기",
    title: "설정",
    languageLabel: "모국어",
    languageGroupAriaLabel: "모국어 선택",
    languageHint: "선택한 모국어에 따라 기본 번역 방향이 결정됩니다.",
    uiLanguageLabel: "화면 언어",
    uiLanguageGroupAriaLabel: "화면 언어 선택",
    uiLanguageHint: "이 브라우저에서 화면 문구가 표시되는 언어입니다. 모국어와는 별개예요.",
    aiModelTitle: "AI 모델",
    apiKeyIntro:
      "Gemini API 키를 입력하세요. 키는 이 브라우저의 localStorage에만 저장되며, 분석 요청 시 서버로 전달되어 API 호출에만 사용됩니다.",
    apiKeyLabel: "API 키",
    apiKeyPlaceholder: "AIza...",
    geminiGuideSummary: "API 키 발급하는 방법 (처음이신가요?)",
    geminiGuideStep1Rest: "접속 후 평소 쓰는 Gmail 계정으로 로그인",
    geminiGuideSteps: [
      '"Create API key" 버튼 클릭',
      '"새 프로젝트 만들기(Create API key in new project)" 선택',
      'AIza로 시작하는 키가 나오면 복사 버튼으로 복사 — 이 키는 비밀번호처럼 지금 이 화면에서만 보이고 나중에 다시 확인할 수 없으니, 반드시 지금 복사해서 저장해두세요',
      "위 API 키 입력란에 붙여넣기",
    ],
    geminiGuideCaution:
      "이 키는 비밀번호와 같습니다. 남에게 보여주거나 전달하지 마세요. 카드 등록 없이 하루 일정량까지 무료로 사용할 수 있습니다.",
    modelLabel: "모델 (선택)",
    modelPlaceholder: "gemini-3.5-flash-lite (기본값)",
    onboardingApiKeyTitle: "AI 모델 설정",
    onboardingApiKeySubtitle: "학습을 시작하려면 먼저 Gemini API 키를 입력해주세요.",
    save: "저장",
    testConnection: "연결 테스트",
    testing: "테스트 중...",
    testSuccess: "연결 성공! 저장을 눌러 반영하세요.",
    signOut: "로그아웃",
    signingOut: "로그아웃 중...",
  },
  ja: {
    back: "← 戻る",
    title: "設定",
    languageLabel: "母国語",
    languageGroupAriaLabel: "母国語を選択",
    languageHint: "選択した母国語によって基本の翻訳方向が決まります。",
    uiLanguageLabel: "画面言語",
    uiLanguageGroupAriaLabel: "画面言語を選択",
    uiLanguageHint: "このブラウザで画面の文言が表示される言語です。母国語とは別の設定です。",
    aiModelTitle: "AIモデル",
    apiKeyIntro:
      "Gemini APIキーを入力してください。キーはこのブラウザのlocalStorageにのみ保存され、分析リクエスト時にサーバーへ送られてAPI呼び出しにのみ使用されます。",
    apiKeyLabel: "APIキー",
    apiKeyPlaceholder: "AIza...",
    geminiGuideSummary: "APIキーの取得方法（初めての方向け）",
    geminiGuideStep1Rest: "にアクセスし、普段使っているGmailアカウントでログイン",
    geminiGuideSteps: [
      '"Create API key" ボタンをクリック',
      '"新しいプロジェクトを作成（Create API key in new project）"を選択',
      "AIzaから始まるキーが表示されたらコピーボタンでコピー — このキーはパスワードのようにこの画面でしか表示されず、後から確認できないので、必ず今コピーして保存しておいてください",
      "上のAPIキー入力欄に貼り付け",
    ],
    geminiGuideCaution:
      "このキーはパスワードと同じです。他人に見せたり渡したりしないでください。カード登録なしで1日一定量まで無料で使えます。",
    modelLabel: "モデル（任意）",
    modelPlaceholder: "gemini-3.5-flash-lite（デフォルト）",
    onboardingApiKeyTitle: "AIモデル設定",
    onboardingApiKeySubtitle: "学習を始めるには、まずGemini APIキーを入力してください。",
    save: "保存",
    testConnection: "接続テスト",
    testing: "テスト中...",
    testSuccess: "接続成功！保存を押して反映してください。",
    signOut: "ログアウト",
    signingOut: "ログアウト中...",
  },
};
