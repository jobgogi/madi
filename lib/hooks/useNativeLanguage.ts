import { useEffect, useState } from "react";
import { loadNativeLanguage, saveNativeLanguage, type NativeLanguage } from "@/lib/native-language";

// 온보딩(언어 선택)/설정 화면이 공유하는 모국어 상태 - localStorage
// 프리필과 저장을 컴포넌트 밖으로 분리. 마운트 전에는 null(아직 선택 안 함).
export function useNativeLanguage(): {
  language: NativeLanguage | null;
  setLanguage: (lang: NativeLanguage) => void;
  loaded: boolean;
} {
  const [language, setLanguageState] = useState<NativeLanguage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageState(loadNativeLanguage());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoaded(true);
  }, []);

  function setLanguage(lang: NativeLanguage): void {
    saveNativeLanguage(lang);
    setLanguageState(lang);
  }

  return { language, setLanguage, loaded };
}
