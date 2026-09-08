import type { NativeLanguage } from "@/lib/native-language";

interface SigninText {
  subtitle: string;
  ctaLabel: string;
  ctaAriaLabel: string;
  loading: string;
  callbackError: string;
}

export const signin: Record<NativeLanguage, SigninText> = {
  ko: {
    subtitle: "AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습",
    ctaLabel: "Google로 로그인",
    ctaAriaLabel: "Google 계정으로 로그인",
    loading: "로그인 중...",
    callbackError: "로그인에 실패했습니다. 다시 시도해 주세요.",
  },
  ja: {
    subtitle: "AIが作った基準訳とあなたの翻訳を比較しながら、一文ずつ確認する翻訳学習",
    ctaLabel: "Googleでログイン",
    ctaAriaLabel: "Googleアカウントでログイン",
    loading: "ログイン中...",
    callbackError: "ログインに失敗しました。もう一度お試しください。",
  },
};
