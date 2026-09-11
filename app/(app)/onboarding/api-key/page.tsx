"use client";

import { useRouter } from "next/navigation";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";
import { useUiLanguage } from "@/lib/hooks/useUiLanguage";
import { settingsText } from "@/lib/i18n/settings";
import { GeminiApiKeyField } from "@/components/GeminiApiKeyField";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function ApiKeyOnboardingPage() {
  const router = useRouter();
  const { apiKey, setApiKey, model, setModel, save } = useSettingsForm();
  const { uiLanguage, setUiLanguage } = useUiLanguage();
  const t = settingsText[uiLanguage];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    save();
    router.replace("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-zinc-200 bg-white p-8"
      >
        <div className="flex justify-end">
          <LanguageToggle value={uiLanguage} onChange={setUiLanguage} ariaLabel={t.uiLanguageGroupAriaLabel} />
        </div>

        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{t.onboardingApiKeyTitle}</h1>
          <p className="mt-2 text-sm text-zinc-500">{t.onboardingApiKeySubtitle}</p>
        </div>

        <GeminiApiKeyField apiKey={apiKey} setApiKey={setApiKey} locale={uiLanguage} />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">{t.modelLabel}</span>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            placeholder={t.modelPlaceholder}
          />
        </label>

        <button
          type="submit"
          disabled={!apiKey.trim()}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {t.save}
        </button>
      </form>
    </div>
  );
}
