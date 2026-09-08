import type { NativeLanguage } from "@/lib/native-language";

export const settingsText: Record<
  NativeLanguage,
  {
    back: string;
    title: string;
    languageLabel: string;
    languageGroupAriaLabel: string;
    languageHint: string;
    aiModelTitle: string;
    apiKeyIntro: string;
    providerLabel: string;
    providerAriaLabel: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    workspaceIdLabel: string;
    workspaceIdPlaceholder: string;
    workspaceIdHintBefore: string;
    workspaceIdHintAfter: string;
    modelLabel: string;
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
    languageLabel: "학습 언어",
    languageGroupAriaLabel: "학습 언어 선택",
    languageHint: "선택한 언어에 따라 기본 번역 방향이 결정됩니다.",
    aiModelTitle: "AI 모델",
    apiKeyIntro:
      "사용할 AI와 API 키를 선택하세요. 키는 이 브라우저의 localStorage에만 저장되며, 분석 요청 시 서버로 전달되어 API 호출에만 사용됩니다.",
    providerLabel: "AI 제공자",
    providerAriaLabel: "AI 제공자 선택",
    apiKeyLabel: "API 키",
    apiKeyPlaceholder: "sk-...",
    workspaceIdLabel: "Workspace ID (선택)",
    workspaceIdPlaceholder: "wrkspc_...",
    workspaceIdHintBefore:
      '"anthropic-workspace-id is required" 오류가 뜬다면, 여러 workspace에 걸친 개인 키를 쓰고 있다는 뜻입니다.',
    workspaceIdHintAfter: "에서 workspace ID를 확인해 여기에 입력하세요.",
    modelLabel: "모델 (선택)",
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
    languageLabel: "学習言語",
    languageGroupAriaLabel: "学習言語を選択",
    languageHint: "選択した言語によって基本の翻訳方向が決まります。",
    aiModelTitle: "AIモデル",
    apiKeyIntro:
      "使用するAIとAPIキーを選択してください。キーはこのブラウザのlocalStorageにのみ保存され、分析リクエスト時にサーバーへ送られてAPI呼び出しにのみ使用されます。",
    providerLabel: "AIプロバイダー",
    providerAriaLabel: "AIプロバイダーを選択",
    apiKeyLabel: "APIキー",
    apiKeyPlaceholder: "sk-...",
    workspaceIdLabel: "Workspace ID（任意）",
    workspaceIdPlaceholder: "wrkspc_...",
    workspaceIdHintBefore:
      '"anthropic-workspace-id is required" というエラーが出た場合、複数のworkspaceにまたがる個人キーを使用しているという意味です。',
    workspaceIdHintAfter: "でworkspace IDを確認し、ここに入力してください。",
    modelLabel: "モデル（任意）",
    save: "保存",
    testConnection: "接続テスト",
    testing: "テスト中...",
    testSuccess: "接続成功！保存を押して反映してください。",
    signOut: "ログアウト",
    signingOut: "ログアウト中...",
  },
};
