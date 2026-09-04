"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deleteSession, getSession, type HistorySession } from "@/lib/history";
import { AnalysisReportView } from "@/components/AnalysisReportView";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<HistorySession | null | undefined>(
    undefined,
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // 클라이언트 전용 localStorage를 마운트 후 한 번만 읽는다 (SSR/hydration 안전).
    const loaded = getSession(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loaded);
  }, [params.id]);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <main className="flex w-full max-w-2xl flex-col gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            해당 기록을 찾을 수 없습니다.
          </p>
          <Link href="/" className="text-sm underline">
            대시보드로 돌아가기
          </Link>
        </main>
      </div>
    );
  }

  const sentence = session.sentences[index];
  const total = session.sentences.length;
  const isLast = index === total - 1;

  function handleNext() {
    if (!session) return;
    if (isLast) {
      // 문장이 1개뿐이면 종합 분석 페이지를 건너뛰고 바로 대시보드로.
      router.push(total > 1 ? `/history/${session.id}/summary` : "/");
    } else {
      setIndex((i) => i + 1);
    }
  }

  function handleDeleteSession() {
    if (!session) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    deleteSession(session.id);
    router.push("/history");
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
            >
              ← 대시보드로
            </Link>
            {total > 1 && (
              <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {index + 1}/{total} 문장
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="이 기록 전체 삭제"
            onClick={handleDeleteSession}
            className="shrink-0 text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            기록 삭제
          </button>
        </header>

        {total > 1 && (
          <div
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  원문
                </span>{" "}
                <span className="text-zinc-700 dark:text-zinc-300">
                  {sentence.sourceText}
                </span>
              </p>
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  내 번역
                </span>{" "}
                <span className="text-zinc-700 dark:text-zinc-300">
                  {sentence.userTranslation}
                </span>
              </p>
              {sentence.report.suggested_translations[0] && (
                <p>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    AI 번역(기준)
                  </span>{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {sentence.report.suggested_translations[0]}
                  </span>
                </p>
              )}
            </div>
            {sentence.durationMs !== undefined && (
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                {(sentence.durationMs / 1000).toFixed(1)}초
              </span>
            )}
          </div>

          <AnalysisReportView
            report={sentence.report}
            userTranslation={sentence.userTranslation}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleNext}
            aria-label={
              isLast
                ? total > 1
                  ? "종합 분석 보기"
                  : "완료하고 대시보드로 이동"
                : "다음 문장으로"
            }
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isLast ? (total > 1 ? "종합 분석 보기" : "완료") : "다음 문장"}
          </button>
        </div>
      </main>
    </div>
  );
}
