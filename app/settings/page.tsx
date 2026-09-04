"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadSettings, saveSettings, type Provider } from "@/lib/settings";

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
};

const MODEL_PLACEHOLDER: Record<Provider, string> = {
  claude: "claude-opus-5 (기본값)",
  openai: "gpt-5 (최신 모델명은 직접 확인 후 입력 권장)",
};

const API_KEY_LINK: Record<Provider, { href: string; label: string }> = {
  claude: {
    href: "https://platform.claude.com/settings/keys",
    label: "platform.claude.com에서 발급",
  },
  openai: {
    href: "https://platform.openai.com/api-keys",
    label: "platform.openai.com에서 발급",
  },
};

type TestState =
  | { status: "idle" }
  | { status: "testing" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function SettingsPage() {
  const router = useRouter();
  const [provider, setProvider] = useState<Provider>("claude");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [testState, setTestState] = useState<TestState>({ status: "idle" });

  useEffect(() => {
    // One-time prefill from a client-only source (localStorage) on mount.
    const existing = loadSettings();
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProvider(existing.provider);
      setApiKey(existing.apiKey);
      setModel(existing.model ?? "");
      setWorkspaceId(existing.workspaceId ?? "");
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveSettings({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      workspaceId: provider === "claude" ? workspaceId.trim() || undefined : undefined,
    });
    router.push("/");
  }

  async function handleTestConnection() {
    setTestState({ status: "testing" });
    try {
      const res = await fetch("/api/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          model: model.trim() || undefined,
          workspaceId:
            provider === "claude" ? workspaceId.trim() || undefined : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "연결 테스트에 실패했습니다.");
      }
      setTestState({ status: "success" });
    } catch (err) {
      setTestState({
        status: "error",
        message: err instanceof Error ? err.message : "알 수 없는 오류입니다.",
      });
    }
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="flex w-full max-w-lg flex-col gap-8">
        <header>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← 돌아가기
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            설정
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            사용할 AI와 API 키를 선택하세요. 키는 이 브라우저의 localStorage에만
            저장되며, 분석 요청 시 서버로 전달되어 API 호출에만 사용됩니다.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              AI 제공자
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              aria-label="AI 제공자 선택"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {(Object.keys(PROVIDER_LABEL) as Provider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              API 키
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              autoComplete="off"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="sk-..."
            />
            <a
              href={API_KEY_LINK[provider].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
            >
              {API_KEY_LINK[provider].label}
            </a>
          </label>

          {provider === "claude" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Workspace ID (선택)
              </span>
              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                placeholder="wrkspc_..."
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                &quot;anthropic-workspace-id is required&quot; 오류가 뜬다면, 여러
                workspace에 걸친 개인 키를 쓰고 있다는 뜻입니다.{" "}
                <a
                  href="https://platform.claude.com/settings/workspaces"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  platform.claude.com/settings/workspaces
                </a>
                에서 workspace ID를 확인해 여기에 입력하세요.
              </p>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              모델 (선택)
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder={MODEL_PLACEHOLDER[provider]}
            />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                저장
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!apiKey.trim() || testState.status === "testing"}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {testState.status === "testing" ? "테스트 중..." : "연결 테스트"}
              </button>
            </div>
            {testState.status === "success" && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                연결 성공! 저장을 눌러 반영하세요.
              </p>
            )}
            {testState.status === "error" && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {testState.message}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
