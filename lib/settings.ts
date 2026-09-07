import { useState } from "react";

export type Provider = "claude" | "openai" | "gemini";

export interface Settings {
  provider: Provider;
  apiKey: string;
  // 비워두면 서버 쪽 기본 모델을 사용한다.
  model?: string;
  // Claude 개인 키(personal key)가 여러 workspace에 걸쳐 있는 경우("멀티 워크스페이스
  // 키") 요청마다 어느 workspace에서 실행할지 anthropic-workspace-id 헤더로
  // 알려줘야 한다. 단일 workspace 전용 키라면 비워둬도 된다.
  workspaceId?: string;
}

const STORAGE_KEY = "madi:settings";

function isProvider(value: unknown): value is Provider {
  return value === "claude" || value === "openai" || value === "gemini";
}

export function loadSettings(): Settings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "provider" in parsed &&
      "apiKey" in parsed &&
      isProvider((parsed as { provider: unknown }).provider) &&
      typeof (parsed as { apiKey: unknown }).apiKey === "string" &&
      (parsed as { apiKey: string }).apiKey.length > 0
    ) {
      return parsed as Settings;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export type TestConnectionState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "success" }
  | { status: "error"; message: string };

export interface TestConnectionParams {
  provider: Provider;
  apiKey: string;
  model?: string;
  workspaceId?: string;
}

// 설정 화면의 "연결 테스트" 버튼 로직 - fetch 호출과 상태 전이를 컴포넌트
// 밖으로 분리.
export function useTestConnection(): {
  state: TestConnectionState;
  test: (params: TestConnectionParams) => Promise<void>;
} {
  const [state, setState] = useState<TestConnectionState>({ status: "idle" });

  async function test(params: TestConnectionParams): Promise<void> {
    setState({ status: "testing" });
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "연결 테스트에 실패했습니다.");
      }
      setState({ status: "success" });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "알 수 없는 오류입니다.",
      });
    }
  }

  return { state, test };
}
