"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, monthLabels, type ActivityDay } from "@/lib/dashboard-stats";
import { DIRECTION_FILTER_OPTIONS, useDashboardData, type DirectionFilter } from "@/lib/hooks/useDashboardData";
import { useLocale } from "@/lib/hooks/useLocale";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { useHasApiKey } from "@/lib/hooks/useHasApiKey";
import { dashboardText } from "@/lib/i18n/dashboard";
import { SessionCard } from "@/components/SessionCard";

const LEVEL_COLOR: Record<ActivityDay["level"], string> = {
  0: "bg-zinc-100",
  1: "bg-teal-100",
  2: "bg-teal-300",
  3: "bg-teal-500",
  4: "bg-teal-700",
};

export function DashboardClient() {
  const router = useRouter();
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const data = useDashboardData(direction);
  const { language, loaded } = useNativeLanguage();
  const hasApiKey = useHasApiKey();
  const locale = useLocale();
  const t = dashboardText[locale];

  useEffect(() => {
    if (loaded && language === null) {
      router.replace("/onboarding/language");
      return;
    }
    if (loaded && language !== null && hasApiKey === false) {
      router.replace("/onboarding/api-key");
    }
  }, [loaded, language, hasApiKey, router]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
        <div role="status" aria-live="polite" className="text-sm text-zinc-500">
          {t.loading}
        </div>
      </div>
    );
  }

  const { activityGrid, categories, recent } = data;
  const months = monthLabels(activityGrid);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <main className="flex w-full max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">{t.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/settings" className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline">
              {t.settingsLink}
            </Link>
            <Link
              href="/new"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              {t.newSessionButton}
            </Link>
          </div>
        </header>

        <div className="flex gap-2" role="group" aria-label={t.directionFilterLabel}>
          {DIRECTION_FILTER_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              aria-pressed={direction === d}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                direction === d
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {t.directionFilterOptionLabel[d]}
            </button>
          ))}
        </div>

        <section aria-label={t.activitySectionLabel}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">{t.activityHeading}</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-1 overflow-x-auto">
              <div className="ml-8 flex gap-1">
                {months.map((month, wi) => (
                  <div
                    key={wi}
                    className="w-3 shrink-0 overflow-visible whitespace-nowrap text-[10px] text-zinc-500"
                  >
                    {month ? t.monthLabel(month) : ""}
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="mr-1 flex w-7 flex-col gap-1">
                  {t.weekdayLabels.map((label, i) => (
                    <div key={i} className="h-3 text-right text-[10px] leading-3 text-zinc-500">
                      {label}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1">
                  {activityGrid.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day) => (
                        <div
                          key={day.date}
                          title={t.dayTitle(day.date, day.count)}
                          className={`h-3 w-3 rounded-sm ${day.future ? "bg-zinc-50" : LEVEL_COLOR[day.level]}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-xs text-zinc-500">
              <span>{t.legendLow}</span>
              {([0, 1, 2, 3, 4] as const).map((l) => (
                <span key={l} aria-hidden className={`h-3 w-3 rounded-sm ${LEVEL_COLOR[l]}`} />
              ))}
              <span>{t.legendHigh}</span>
            </div>
          </div>
        </section>

        <section aria-label={t.categoriesSectionLabel}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">{t.categoriesHeading}</h2>
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              {t.categoriesEmpty}
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
              {categories.map(({ category, count }) => (
                <Link
                  key={category}
                  href={`/history?category=${category}`}
                  aria-label={t.categoryLinkLabel(CATEGORY_LABEL[locale][category], count)}
                  className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-400"
                >
                  <span className="text-xs text-zinc-500">{CATEGORY_LABEL[locale][category]}</span>
                  <span className="text-lg font-semibold text-zinc-900">{t.categoryCount(count)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-label={t.recentSectionLabel}>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">{t.recentHeading}</h2>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              {t.recentEmpty}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recent.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </ul>
          )}
        </section>

        <Link href="/history" className="self-center text-sm text-zinc-600 hover:text-zinc-900 hover:underline">
          {t.historyLink}
        </Link>
      </main>
    </div>
  );
}
