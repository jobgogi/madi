import { useEffect, useState } from "react";
import { loadUiLanguage, saveUiLanguage } from "@/lib/ui-language";
import { detectBrowserLanguage, type NativeLanguage } from "@/lib/native-language";

// 화면 문구 표시 언어 - localStorage에 저장된 선택이 없으면(온보딩 전이거나
// 한 번도 토글을 안 바꾼 경우) 브라우저 언어 설정을 최선 추정치로 쓴다.
// SSR 시점엔 "ko"로 시작하고 마운트 후 실제 값으로 한 번 갱신한다
// (hydration 안전). 모국어(native_language, DB 저장)와는 별개 개념.
export function useUiLanguage(): {
  uiLanguage: NativeLanguage;
  setUiLanguage: (lang: NativeLanguage) => void;
} {
  const [stored, setStored] = useState<NativeLanguage | null>(null);
  const [browserLanguage, setBrowserLanguage] = useState<NativeLanguage>("ko");

  useEffect(() => {
    setStored(loadUiLanguage());
    setBrowserLanguage(detectBrowserLanguage());
  }, []);

  function setUiLanguage(lang: NativeLanguage): void {
    setStored(lang);
    saveUiLanguage(lang);
  }

  return { uiLanguage: stored ?? browserLanguage, setUiLanguage };
}
