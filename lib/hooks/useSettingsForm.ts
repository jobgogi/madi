import { useEffect, useState } from "react";
import { loadSettings, saveSettings } from "@/lib/settings";

const PROVIDER = "gemini" as const;

// 설정 화면의 폼 상태 - localStorage 프리필과 저장을 컴포넌트 밖으로 분리.
// provider는 당분간 Gemini로 고정 (Claude/ChatGPT는 UI에서 숨김).
export function useSettingsForm(): {
  apiKey: string;
  setApiKey: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  save: () => void;
} {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");

  useEffect(() => {
    // 마운트 후 클라이언트 전용 localStorage를 한 번만 읽어 프리필 (SSR/hydration 안전).
    const existing = loadSettings();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiKey(existing.apiKey);
      setModel(existing.model ?? "");
    }
  }, []);

  function save(): void {
    saveSettings({
      provider: PROVIDER,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
    });
  }

  return { apiKey, setApiKey, model, setModel, save };
}
