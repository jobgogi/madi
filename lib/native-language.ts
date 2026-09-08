import type { Direction } from "@/lib/analysis-schema";

export type NativeLanguage = "ko" | "ja";

const STORAGE_KEY = "madi:native-language";

function isNativeLanguage(value: unknown): value is NativeLanguage {
  return value === "ko" || value === "ja";
}

export function loadNativeLanguage(): NativeLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isNativeLanguage(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function saveNativeLanguage(lang: NativeLanguage): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}

// 모국어에 따른 기본 학습 방향 - 한국어 화자는 일본어를 한국어로,
// 일본어 화자는 한국어를 일본어로 번역하며 학습한다.
export function directionForLanguage(lang: NativeLanguage): Direction {
  return lang === "ko" ? "ja_to_ko" : "ko_to_ja";
}
