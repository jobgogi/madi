import { useEffect, useState } from "react";
import { loadNativeLanguage, saveNativeLanguage, type NativeLanguage } from "@/lib/native-language";

// 온보딩(언어 선택)/설정 화면이 공유하는 모국어 상태 - localStorage
// 프리필과 저장을 컴포넌트 밖으로 분리. 마운트 전에는 null(아직 선택 안 함).
export function useNativeLanguage(): {
  language: NativeLanguage | null;
  setLanguage: (lang: NativeLanguage) => Promise<void>;
  loaded: boolean;
} {
  const [language, setLanguageState] = useState<NativeLanguage | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadNativeLanguage().then((lang) => {
      if (cancelled) return;
      setLanguageState(lang);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // 저장 완료를 기다렸다가 resolve한다 - 호출부(onboarding 화면)가 이 직후
  // router.push하는데, 쓰기 전에 이동하면 이동한 화면이 아직 DB에 반영되지
  // 않은 이전 값을 읽어 온보딩으로 되돌아가는 레이스가 생겼었다.
  async function setLanguage(lang: NativeLanguage): Promise<void> {
    setLanguageState(lang);
    await saveNativeLanguage(lang);
  }

  return { language, setLanguage, loaded };
}
