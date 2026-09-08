import { useEffect, useState } from "react";
import { useNativeLanguage } from "./useNativeLanguage";
import { detectBrowserLanguage, type NativeLanguage } from "@/lib/native-language";

// 화면 문구 표시 언어. DB의 native_language 로딩이 끝나기 전(또는 온보딩
// 전이라 값이 아예 없는 경우)에는 무조건 "ko"로 보여주는 대신 브라우저
// 언어 설정을 최선 추정치로 쓴다. SSR 시점엔 "ko"로 시작하고 마운트 후
// 실제 브라우저 언어로 한 번 갱신한다 (hydration 안전).
export function useLocale(): NativeLanguage {
  const { language } = useNativeLanguage();
  const [browserLanguage, setBrowserLanguage] = useState<NativeLanguage>("ko");

  useEffect(() => {
    setBrowserLanguage(detectBrowserLanguage());
  }, []);

  return language ?? browserLanguage;
}
