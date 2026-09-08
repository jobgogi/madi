import { useEffect, useState } from "react";
import { loadSettings } from "@/lib/settings";

// "새 학습" 시작 전에 AI 모델(API 키)이 설정돼 있는지 확인 - 없으면 화면에서
// 설정 페이지로 안내한다. 마운트 후 localStorage를 한 번만 읽는다.
export function useHasApiKey(): boolean | null {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    setHasApiKey(loadSettings() !== null);
  }, []);

  return hasApiKey;
}
