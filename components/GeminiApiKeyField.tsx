import type { NativeLanguage } from "@/lib/native-language";
import { settingsText } from "@/lib/i18n/settings";

const API_KEY_URL = "https://aistudio.google.com/apikey";

interface GeminiApiKeyFieldProps {
  apiKey: string;
  setApiKey: (v: string) => void;
  locale: NativeLanguage;
}

// 설정 화면과 온보딩(API 키 입력) 화면이 공유하는 Gemini API 키 입력 필드.
export function GeminiApiKeyField({ apiKey, setApiKey, locale }: GeminiApiKeyFieldProps) {
  const t = settingsText[locale];

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700">{t.apiKeyLabel}</span>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        required
        autoComplete="off"
        className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        placeholder={t.apiKeyPlaceholder}
      />
      {!apiKey && (
        <details open className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-base text-zinc-700">
          <summary className="cursor-pointer font-semibold text-zinc-900">{t.geminiGuideSummary}</summary>
          <ol className="mt-2.5 list-decimal space-y-2 pl-5">
            <li>
              <a
                href={API_KEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-teal-700 underline hover:text-teal-800"
              >
                aistudio.google.com/apikey
              </a>{" "}
              {t.geminiGuideStep1Rest}
            </li>
            {t.geminiGuideSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 font-medium text-amber-800">
            {t.geminiGuideCaution}
          </div>
        </details>
      )}
    </label>
  );
}
