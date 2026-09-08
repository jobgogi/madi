import type { NativeLanguage } from "@/lib/native-language";

interface Feature {
  title: string;
  body: string;
}

interface LandingText {
  badge: string;
  heroPrefix: string;
  heroHighlight: string;
  heroSuffix: string;
  subtitle: string;
  freeNote: string;
  ctaLabel: string;
  features: Feature[];
  finalCta: string;
  languageToggleAriaLabel: string;
}

export const landing: Record<NativeLanguage, LandingText> = {
  ko: {
    badge: "일본어를 배우는 한국인, 한국어를 배우는 일본인을 위한",
    heroPrefix: "내 번역, ",
    heroHighlight: "AI가 문장 하나하나",
    heroSuffix: " 짚어드립니다",
    subtitle: "AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습 — 마디",
    freeNote: "무료로 시작 · 내 API 키는 이 브라우저에만 저장됩니다",
    ctaLabel: "Google로 시작하기",
    features: [
      {
        title: "문장 단위 정밀 비교",
        body: "원문을 자동으로 문장 단위로 나누고, AI 기준 번역과 내 번역을 색으로 대조해 어디가 다른지 한눈에 보여줘요.",
      },
      {
        title: "뜻이 뒤바뀌는 실수부터 우선 확인",
        body: "부정어 누락처럼 의미가 반전되는 critical 오류를 가장 먼저 짚고, 조사·경어·어순·뉘앙스까지 10개 카테고리로 나눠 알려드려요.",
      },
      {
        title: "JLPT · TOPIK 레벨 자동 판정",
        body: "번역한 문장의 난이도를 자동으로 측정해, 내가 지금 어느 수준인지 문장마다 확인할 수 있어요.",
      },
      {
        title: "그래프로 보는 성장",
        body: "잔디 그래프로 학습 꾸준함을, 카테고리별 통계로 자주 틀리는 부분이 줄어드는지 눈으로 확인하세요.",
      },
      {
        title: "내 API 키로, 내 방식대로",
        body: "OpenAI · Claude · Gemini 중 원하는 AI를 선택하세요. API 키는 서버를 거치지 않고 이 브라우저에만 저장됩니다.",
      },
    ],
    finalCta: "지금 바로 한 문장부터 시작해보세요",
    languageToggleAriaLabel: "화면 언어 선택",
  },
  ja: {
    badge: "日本語を学ぶ韓国人、韓国語を学ぶ日本人のための",
    heroPrefix: "あなたの翻訳を、",
    heroHighlight: "AIが一文ずつ",
    heroSuffix: "丁寧に添削します",
    subtitle: "AIが作った基準訳とあなたの翻訳を比較しながら、一文ずつ確認する翻訳学習 — マディ",
    freeNote: "無料で開始 · APIキーはこのブラウザにのみ保存されます",
    ctaLabel: "Googleで始める",
    features: [
      {
        title: "文単位での精密な比較",
        body: "原文を自動で文単位に分け、AI基準訳とあなたの翻訳を色で対比してどこが違うか一目で分かります。",
      },
      {
        title: "意味が反転するミスを最優先で確認",
        body: "否定語の欠落など意味が反転するcriticalなミスを最初に指摘し、助詞・敬語・語順・ニュアンスまで10のカテゴリに分けてお知らせします。",
      },
      {
        title: "JLPT・TOPIKレベル自動判定",
        body: "翻訳した文章の難易度を自動で測定し、今の自分のレベルを文ごとに確認できます。",
      },
      {
        title: "グラフで見る成長",
        body: "芝生グラフで学習の継続度を、カテゴリ別統計でよく間違える部分が減っているかを目で確認できます。",
      },
      {
        title: "自分のAPIキーで、自分のやり方で",
        body: "OpenAI・Claude・Geminiの中から好きなAIを選べます。APIキーはサーバーを経由せず、このブラウザにのみ保存されます。",
      },
    ],
    finalCta: "今すぐ一文から始めてみましょう",
    languageToggleAriaLabel: "画面言語の選択",
  },
};
