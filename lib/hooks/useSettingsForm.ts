import { useEffect, useState } from "react";
import { loadSettings, saveSettings, type Provider } from "@/lib/settings";

// 설정 화면의 폼 상태 - localStorage 프리필과 저장을 컴포넌트 밖으로 분리.
export function useSettingsForm(): {
  provider: Provider;
  setProvider: (p: Provider) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  workspaceId: string;
  setWorkspaceId: (v: string) => void;
  save: () => void;
} {
  const [provider, setProvider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  useEffect(() => {
    // 마운트 후 클라이언트 전용 localStorage를 한 번만 읽어 프리필 (SSR/hydration 안전).
    const existing = loadSettings();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setModel(existing.model ?? "");
      setWorkspaceId(existing.workspaceId ?? "");
    }
  }, []);

  function save(): void {
    saveSettings({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      workspaceId: provider === "claude" ? workspaceId.trim() || undefined : undefined,
    });
  }

  return { provider, setProvider, apiKey, setApiKey, model, setModel, workspaceId, setWorkspaceId, save };
}
