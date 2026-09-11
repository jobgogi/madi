import type { NativeLanguage } from "@/lib/native-language";

const OPTIONS: { value: NativeLanguage; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

interface LanguageToggleProps {
  value: NativeLanguage;
  onChange: (v: NativeLanguage) => void;
  ariaLabel: string;
}

// 설정 화면(모국어/화면 언어)과 온보딩 화면이 공유하는 ko/ja 토글 버튼.
export function LanguageToggle({ value, onChange, ariaLabel }: LanguageToggleProps) {
  return (
    <div className="flex gap-2" role="group" aria-label={ariaLabel}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
