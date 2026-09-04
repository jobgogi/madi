"use client";

import Link from "next/link";
import { useSessions } from "@/lib/history";
import { SessionCard } from "@/components/SessionCard";

const RECENT_LIMIT = 5;

export default function Dashboard() {
  const [sessions] = useSessions();
  const recent = [...(sessions ?? [])]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, RECENT_LIMIT);

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              마디 — 일한 번역 분석 도구
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              일본어 원문과 본인의 한국어 번역을 비교 분석해줍니다.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/settings"
              className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
            >
              설정
            </Link>
            <Link
              href="/new"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              새 학습 시작
            </Link>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            최근 기록
          </h2>
          {recent.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              아직 저장된 분석 기록이 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <ul className="flex flex-col gap-2">
                {recent.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </ul>
              {(sessions ?? []).length > RECENT_LIMIT && (
                <Link
                  href="/history"
                  className="self-end text-sm text-zinc-500 hover:underline dark:text-zinc-400"
                >
                  전체 기록 보기 ({(sessions ?? []).length}건)
                </Link>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
