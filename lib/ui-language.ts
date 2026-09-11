import type { NativeLanguage } from "@/lib/native-language";

const STORAGE_KEY = "madi:uiLanguage";

// 화면 문구 표시 언어 - 모국어(native_language, DB 저장, 번역 방향 결정용)와는
// 별개 개념이라 이 브라우저의 localStorage에만 저장한다.
export function loadUiLanguage(): NativeLanguage | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw === "ko" || raw === "ja" ? raw : null;
}

export function saveUiLanguage(lang: NativeLanguage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}
