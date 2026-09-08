"use client";

import { useState } from "react";
import Link from "next/link";
import { EditCompareIcon, LockIcon, ShieldBadgeIcon, TrendingUpIcon, WarningTriangleIcon } from "@/components/icons";
import { landing } from "@/lib/i18n/landing";
import type { NativeLanguage } from "@/lib/native-language";

const FEATURE_ICONS = [EditCompareIcon, WarningTriangleIcon, ShieldBadgeIcon, TrendingUpIcon, LockIcon];

const LANGUAGE_OPTIONS: { value: NativeLanguage; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "ja", label: "日本語" },
];

function GoogleCta({ label }: { label: string }) {
  return (
    <Link
      href="/signin"
      className="flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-700"
    >
      <img src="/google-icon.svg" alt="" className="h-[18px] w-[18px]" />
      {label}
    </Link>
  );
}

// 로그인 전이라 DB의 native_language를 못 쓰므로, 서버(Accept-Language
// 헤더)에서 추정한 언어를 초기값으로 받아 화면 우상단 토글로 직접
// 바꿀 수 있게 한다 (선택값은 새로고침하면 다시 서버 추정치로 돌아감 -
// 로그인 전 화면이라 영구 저장할 계정이 없음).
export function LandingClient({ initialLocale }: { initialLocale: NativeLanguage }) {
  const [locale, setLocale] = useState(initialLocale);
  const t = landing[locale];

  return (
    <div className="flex-1 bg-zinc-50">
      <div className="flex justify-end px-4 pt-4">
        <div className="flex gap-1.5" role="group" aria-label={t.languageToggleAriaLabel}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLocale(opt.value)}
              aria-pressed={locale === opt.value}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                locale === opt.value
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-col items-center gap-5 px-4 pb-14 pt-8 text-center sm:pt-12">
        <span className="rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-medium text-zinc-600">
          {t.badge}
        </span>
        <h1 className="max-w-2xl text-3xl leading-snug font-bold text-zinc-900 sm:text-4xl">
          {t.heroPrefix}
          <span className="text-teal-700">{t.heroHighlight}</span>
          {t.heroSuffix}
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-zinc-600">{t.subtitle}</p>
        <div className="mt-2 flex flex-col items-center gap-2.5">
          <GoogleCta label={t.ctaLabel} />
          <p className="text-xs text-zinc-400">{t.freeNote}</p>
        </div>
      </section>

      <section className="flex justify-center px-4 pb-16">
        <div className="grid w-full max-w-4xl grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {t.features.map((feature, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={feature.title} className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-white p-5">
                <Icon className="h-5 w-5 text-teal-700" />
                <p className="text-[15px] font-semibold text-zinc-900">{feature.title}</p>
                <p className="text-[13.5px] leading-relaxed text-zinc-500">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 border-t border-zinc-200 px-4 py-14 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">{t.finalCta}</h2>
        <GoogleCta label={t.ctaLabel} />
      </section>
    </div>
  );
}
