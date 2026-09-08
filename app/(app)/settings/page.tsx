"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Provider } from "@/lib/settings";
import type { NativeLanguage } from "@/lib/native-language";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";
import { useTestConnection } from "@/lib/hooks/useTestConnection";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { useSignOut } from "@/lib/hooks/useSignOut";
import { useLocale } from "@/lib/hooks/useLocale";
import { settingsText } from "@/lib/i18n/settings";

const NATIVE_LANGUAGE_OPTIONS: { value: NativeLanguage; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

const PROVIDER_LABEL: Record<Provider, string> = {
  claude: "Claude (Anthropic)",
  openai: "ChatGPT (OpenAI)",
  gemini: "Gemini (Google) - 무료 티어 있음",
};

const MODEL_PLACEHOLDER: Record<Provider, string> = {
  claude: "claude-opus-5 (기본값)",
  openai: "gpt-5 (최신 모델명은 직접 확인 후 입력 권장)",
  gemini: "gemini-3.5-flash-lite (기본값)",
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
  gemini: {
    href: "https://aistudio.google.com/apikey",
    label: "aistudio.google.com에서 무료로 발급",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { provider, setProvider, apiKey, setApiKey, model, setModel, workspaceId, setWorkspaceId, save } =
    useSettingsForm();
  const { state: testState, test: testConnection } = useTestConnection();
  const { language, setLanguage } = useNativeLanguage();
  const { signOut, loading: signingOut } = useSignOut();
  const locale = useLocale();
  const t = settingsText[locale];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save();
    router.push("/dashboard");
  }

  function handleTestConnection() {
    void testConnection({
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
      workspaceId: provider === "claude" ? workspaceId.trim() || undefined : undefined,
    });
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <main className="flex w-full max-w-lg flex-col gap-8">
        <header>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
          >
            {t.back}
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900">
            {t.title}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{t.languageLabel}</span>
            <div className="flex gap-2" role="group" aria-label={t.languageGroupAriaLabel}>
              {NATIVE_LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => void setLanguage(opt.value)}
                  aria-pressed={language === opt.value}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                    language === opt.value
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500">{t.languageHint}</p>
          </div>

          <hr className="border-zinc-200" />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{t.aiModelTitle}</span>
            <p className="text-sm text-zinc-500">{t.apiKeyIntro}</p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">
              {t.providerLabel}
            </span>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              aria-label={t.providerAriaLabel}
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              {(Object.keys(PROVIDER_LABEL) as Provider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABEL[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">
              {t.apiKeyLabel}
            </span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              autoComplete="off"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder={t.apiKeyPlaceholder}
            />
            <a
              href={API_KEY_LINK[provider].href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline"
            >
              {API_KEY_LINK[provider].label}
            </a>
          </label>

          {provider === "claude" && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700">
                {t.workspaceIdLabel}
              </span>
              <input
                type="text"
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                placeholder={t.workspaceIdPlaceholder}
              />
              <p className="text-xs text-zinc-500">
                {t.workspaceIdHintBefore}{" "}
                <a
                  href="https://platform.claude.com/settings/workspaces"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  platform.claude.com/settings/workspaces
                </a>
                {t.workspaceIdHintAfter}
              </p>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">
              {t.modelLabel}
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder={MODEL_PLACEHOLDER[provider]}
            />
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                {t.save}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={!apiKey.trim() || testState.status === "testing"}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
              >
                {testState.status === "testing" ? t.testing : t.testConnection}
              </button>
            </div>
            {testState.status === "success" && (
              <p className="text-sm text-emerald-600">
                {t.testSuccess}
              </p>
            )}
            {testState.status === "error" && (
              <p className="text-sm text-red-600">
                {testState.message}
              </p>
            )}
          </div>
        </form>

        <hr className="border-zinc-200" />

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="w-full rounded-full border border-red-600 px-5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            {signingOut ? t.signingOut : t.signOut}
          </button>
        </div>
      </main>
    </div>
  );
}
