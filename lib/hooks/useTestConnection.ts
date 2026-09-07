import { useState } from "react";
import type { Provider } from "@/lib/settings";

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
