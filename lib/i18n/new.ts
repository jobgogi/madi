import type { Direction } from "@/lib/analysis-schema";
import type { NativeLanguage } from "@/lib/native-language";

export const newFlow: Record<
  NativeLanguage,
  {
    backToDashboard: string;
    stepAria: string;
    stepSource: string;
    stepTranslate: string;
    sourceTitle: string;
    sourceDescription: string;
    directionAria: string;
    directionLabel: Record<Direction, string>;
    apiKeyMissing: string;
    apiKeyMissingLinkLabel: string;
    apiKeyMissingSuffix: string;
    sourcePlaceholder: string;
    nextButton: string;
    nextButtonAria: string;
    translateTitle: string;
    translateDescription: string;
    sentenceProgress: (done: number, total: number) => string;
    paragraphLabel: (index: number) => string;
    translationAria: (paragraphIndex: number, sentenceIndex: number) => string;
    translationPlaceholder: string;
    errorNoApiKey: string;
    errorNoNativeLanguage: string;
    errorAnalyzeFailed: string;
    errorParseFailed: string;
    errorSaveFailed: string;
    errorNetwork: string;
    analyzeButton: string;
    analyzingButton: string;
  }
> = {
  ko: {
    backToDashboard: "← 대시보드로",
    stepAria: "새 학습 진행 단계",
    stepSource: "원문 입력",
    stepTranslate: "번역 입력",
    sourceTitle: "새 학습 — 원문 입력",
    sourceDescription: "단락 구조를 유지한 채 원문을 입력하세요. 다음 단계에서 단락별로 문장을 나눠 번역합니다.",
    directionAria: "번역 방향 선택",
    directionLabel: {
      ja_to_ko: "일본어 → 한국어",
      ko_to_ja: "한국어 → 일본어",
    },
    apiKeyMissing: "아직 AI 모델이 설정되지 않았습니다.",
    apiKeyMissingLinkLabel: "설정 화면",
    apiKeyMissingSuffix: "에서 API 키를 먼저 등록해주세요.",
    sourcePlaceholder: "원문을 입력하세요 (단락 구분 유지)",
    nextButton: "다음",
    nextButtonAria: "다음 단계로",
    translateTitle: "새 학습 — 번역 입력",
    translateDescription: "단락 단위로 묶인 문장마다 번역을 입력하세요.",
    sentenceProgress: (done, total) => `${done}/${total} 문장 완료`,
    paragraphLabel: (index) => `${index}번째 단락`,
    translationAria: (paragraphIndex, sentenceIndex) =>
      `${paragraphIndex}번째 단락 ${sentenceIndex}번째 문장 번역`,
    translationPlaceholder: "번역을 입력하세요",
    errorNoApiKey: "설정 화면에서 API 키를 먼저 입력해주세요.",
    errorNoNativeLanguage: "모국어가 설정되지 않았습니다. 온보딩을 다시 진행해주세요.",
    errorAnalyzeFailed: "분석 중 오류가 발생했습니다.",
    errorParseFailed: "분석 결과를 처리하지 못했습니다.",
    errorSaveFailed: "기록 저장에 실패했습니다. 로그인 상태를 확인해주세요.",
    errorNetwork: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
    analyzeButton: "분석 시작",
    analyzingButton: "분석 중...",
  },
  ja: {
    backToDashboard: "← ダッシュボードへ",
    stepAria: "新しい学習の進行段階",
    stepSource: "原文入力",
    stepTranslate: "翻訳入力",
    sourceTitle: "新しい学習 — 原文入力",
    sourceDescription: "段落構造を保ったまま原文を入力してください。次の段階で段落ごとに文章を分けて翻訳します。",
    directionAria: "翻訳方向の選択",
    directionLabel: {
      ja_to_ko: "日本語 → 韓国語",
      ko_to_ja: "韓国語 → 日本語",
    },
    apiKeyMissing: "まだAIモデルが設定されていません。",
    apiKeyMissingLinkLabel: "設定画面",
    apiKeyMissingSuffix: "でAPIキーを先に登録してください。",
    sourcePlaceholder: "原文を入力してください（段落区分を保持）",
    nextButton: "次へ",
    nextButtonAria: "次の段階へ",
    translateTitle: "新しい学習 — 翻訳入力",
    translateDescription: "段落ごとにまとまった文章に翻訳を入力してください。",
    sentenceProgress: (done, total) => `${done}/${total}文完了`,
    paragraphLabel: (index) => `${index}番目の段落`,
    translationAria: (paragraphIndex, sentenceIndex) =>
      `${paragraphIndex}番目の段落 ${sentenceIndex}番目の文の翻訳`,
    translationPlaceholder: "翻訳を入力してください",
    errorNoApiKey: "設定画面でAPIキーを先に入力してください。",
    errorNoNativeLanguage: "母国語が設定されていません。オンボーディングをやり直してください。",
    errorAnalyzeFailed: "分析中にエラーが発生しました。",
    errorParseFailed: "分析結果を処理できませんでした。",
    errorSaveFailed: "記録の保存に失敗しました。ログイン状態を確認してください。",
    errorNetwork: "ネットワークエラーが発生しました。もう一度お試しください。",
    analyzeButton: "分析開始",
    analyzingButton: "分析中...",
  },
};
