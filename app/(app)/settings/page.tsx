"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";
import { useTestConnection } from "@/lib/hooks/useTestConnection";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { useUiLanguage } from "@/lib/hooks/useUiLanguage";
import { useSignOut } from "@/lib/hooks/useSignOut";
import { settingsText } from "@/lib/i18n/settings";
import { GeminiApiKeyField } from "@/components/GeminiApiKeyField";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function SettingsPage() {
  const router = useRouter();
  const { apiKey, setApiKey, model, setModel, save } = useSettingsForm();
  const { state: testState, test: testConnection } = useTestConnection();
  const { language, setLanguage } = useNativeLanguage();
  const { uiLanguage, setUiLanguage } = useUiLanguage();
  const { signOut, loading: signingOut } = useSignOut();
  const t = settingsText[uiLanguage];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save();
    router.push("/dashboard");
  }

  function handleTestConnection() {
    void testConnection({
      provider: "gemini",
      apiKey: apiKey.trim(),
      model: model.trim() || undefined,
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
            <LanguageToggle value={language ?? "ko"} onChange={(v) => void setLanguage(v)} ariaLabel={t.languageGroupAriaLabel} />
            <p className="text-xs text-zinc-500">{t.languageHint}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{t.uiLanguageLabel}</span>
            <LanguageToggle value={uiLanguage} onChange={setUiLanguage} ariaLabel={t.uiLanguageGroupAriaLabel} />
            <p className="text-xs text-zinc-500">{t.uiLanguageHint}</p>
          </div>

          <hr className="border-zinc-200" />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">{t.aiModelTitle}</span>
            <p className="text-sm text-zinc-500">{t.apiKeyIntro}</p>
          </div>

          <GeminiApiKeyField apiKey={apiKey} setApiKey={setApiKey} locale={uiLanguage} />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">
              {t.modelLabel}
            </span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
              placeholder={t.modelPlaceholder}
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
