"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORY_LABEL, monthLabels, type ActivityDay } from "@/lib/dashboard-stats";
import { DIRECTION_FILTER_OPTIONS, useDashboardData, type DirectionFilter } from "@/lib/hooks/useDashboardData";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { SessionCard } from "@/components/SessionCard";

const LEVEL_COLOR: Record<ActivityDay["level"], string> = {
  0: "bg-zinc-100",
  1: "bg-teal-100",
  2: "bg-teal-300",
  3: "bg-teal-500",
  4: "bg-teal-700",
};

// row 0 = 일요일(gridStart는 항상 일요일) - 월/수/금만 라벨을 표시해 GitHub
// 컨트리뷰션 그래프처럼 촘촘한 요일 라벨을 피한다.
const WEEKDAY_LABELS = ["", "월", "", "수", "", "금", ""];

const DIRECTION_FILTER_LABEL: Record<DirectionFilter, string> = {
  all: "전체",
  ja_to_ko: "日→韓",
  ko_to_ja: "韓→日",
};

export function DashboardClient() {
  const router = useRouter();
  const [direction, setDirection] = useState<DirectionFilter>("all");
  const data = useDashboardData(direction);
  const { language, loaded } = useNativeLanguage();

  useEffect(() => {
    if (loaded && language === null) router.replace("/onboarding/language");
  }, [loaded, language, router]);

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
        <div role="status" aria-live="polite" className="text-sm text-zinc-500">
          불러오는 중...
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
            <h1 className="text-xl font-semibold text-zinc-900">마디 — 일한 번역 학습 도구</h1>
            <p className="mt-1 text-sm text-zinc-500">
              AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link href="/settings" className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline">
              설정
            </Link>
            <Link
              href="/new"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              새 학습 시작
            </Link>
          </div>
        </header>

        <div className="flex gap-2" role="group" aria-label="번역 방향 필터">
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
              {DIRECTION_FILTER_LABEL[d]}
            </button>
          ))}
        </div>

        <section aria-label="일별 학습 활동">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">학습 활동</h2>
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-1 overflow-x-auto">
              <div className="ml-8 flex gap-1">
                {months.map((month, wi) => (
                  <div
                    key={wi}
                    className="w-3 shrink-0 overflow-visible whitespace-nowrap text-[10px] text-zinc-500"
                  >
                    {month ? `${month}월` : ""}
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="mr-1 flex w-7 flex-col gap-1">
                  {WEEKDAY_LABELS.map((label, i) => (
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
                          title={`${day.date} · ${day.count}건`}
                          className={`h-3 w-3 rounded-sm ${day.future ? "bg-zinc-50" : LEVEL_COLOR[day.level]}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 text-xs text-zinc-500">
              <span>적음</span>
              {([0, 1, 2, 3, 4] as const).map((l) => (
                <span key={l} aria-hidden className={`h-3 w-3 rounded-sm ${LEVEL_COLOR[l]}`} />
              ))}
              <span>많음</span>
            </div>
          </div>
        </section>

        <section aria-label="자주 틀리는 카테고리">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">자주 틀리는 카테고리</h2>
          {categories.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              아직 집계할 기록이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2">
              {categories.map(({ category, count }) => (
                <Link
                  key={category}
                  href={`/history?category=${category}`}
                  aria-label={`${CATEGORY_LABEL[category]} ${count}건 — 해당 기록으로 이동`}
                  className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-3 hover:border-zinc-400"
                >
                  <span className="text-xs text-zinc-500">{CATEGORY_LABEL[category]}</span>
                  <span className="text-lg font-semibold text-zinc-900">{count}건</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-label="최근 기록">
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">최근 기록</h2>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
              아직 저장된 분석 기록이 없습니다.
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
          전체 기록 보기
        </Link>
      </main>
    </div>
  );
}
