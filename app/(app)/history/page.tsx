"use client";

import Link from "next/link";
import { JLPT_LEVELS, type JlptLevel } from "@/lib/analysis-schema";
import { clearHistory, deleteSession, sessionHeadline, type HistorySession } from "@/lib/history";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { CATEGORY_LABEL, filterSessionsByCategory } from "@/lib/dashboard-stats";
import { useSessions } from "@/lib/hooks/useSessions";
import { useCategoryFilterFromQuery } from "@/lib/hooks/useCategoryFilterFromQuery";
import { SessionCard } from "@/components/SessionCard";

export default function HistoryPage() {
  const [sessions, setSessions] = useSessions();
  const categoryFilter = useCategoryFilterFromQuery();

  const visibleSessions = categoryFilter
    ? filterSessionsByCategory(sessions ?? [], categoryFilter)
    : sessions;

  async function handleDelete(id: string) {
    await deleteSession(id);
    setSessions((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  async function handleClearAll() {
    if (!window.confirm("저장된 분석 기록을 모두 삭제할까요?")) return;
    await clearHistory();
    setSessions([]);
  }

  // 세션마다 문장별 난이도가 다를 수 있지만, 그룹핑은 세션의 첫 문장
  // 난이도를 대표값으로 근사한다. headline은 여기서 한 번만 계산해서
  // SessionCard에 넘기고, 카드 안에서 다시 계산하지 않게 한다.
  type Entry = { session: HistorySession; headline: ReturnType<typeof sessionHeadline> };
  const grouped: Record<JlptLevel, Entry[]> = {
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
  };
  for (const session of visibleSessions ?? []) {
    const headline = sessionHeadline(session);
    grouped[headline.level].push({ session, headline });
  }
  for (const level of JLPT_LEVELS) {
    grouped[level].sort((a, b) => b.session.createdAt - a.session.createdAt);
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
            >
              ← 대시보드로
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900">
              전체 기록
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              지금까지 분석한 기록을 난이도(JLPT 등급)별로 모아서 보여줍니다.
            </p>
          </div>
          {sessions !== null && sessions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="shrink-0 text-sm text-zinc-600 hover:text-red-600"
            >
              전체 삭제
            </button>
          )}
        </header>

        {categoryFilter && (
          <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
            <span>카테고리 필터: {CATEGORY_LABEL[categoryFilter]}</span>
            <Link href="/history" className="text-zinc-600 underline hover:text-zinc-900">
              해제
            </Link>
          </div>
        )}

        {visibleSessions !== null && visibleSessions.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
            {categoryFilter ? (
              "이 카테고리에 해당하는 기록이 없습니다."
            ) : (
              <>
                아직 저장된 분석 기록이 없습니다.{" "}
                <Link href="/new" className="underline">
                  번역을 분석해보세요
                </Link>
                .
              </>
            )}
          </p>
        )}

        {JLPT_LEVELS.map((level) =>
          grouped[level].length > 0 ? (
            <section key={level}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${JLPT_STYLE[level]}`}
                >
                  {level}
                </span>
                {grouped[level].length}건
              </h2>
              <ul className="flex flex-col gap-2">
                {grouped[level].map(({ session, headline }) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    headline={headline}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </main>
    </div>
  );
}
