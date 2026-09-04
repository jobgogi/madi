"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, type HistorySession } from "@/lib/history";
import {
  aggregateCategoryCounts,
  aggregateJlptDistribution,
  aggregateSeverityCounts,
  findHardestSentenceIndex,
} from "@/lib/session-summary";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { SEVERITY_LABEL, SEVERITY_STYLE } from "@/lib/severity-style";
import { TranslationComparison } from "@/components/TranslationComparison";

export default function SessionSummaryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<HistorySession | null | undefined>(
    undefined,
  );

  useEffect(() => {
    // 클라이언트 전용 localStorage를 마운트 후 한 번만 읽는다 (SSR/hydration 안전).
    const loaded = getSession(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loaded);
    // 문장이 1개뿐인 세션이 직접 URL로 들어온 경우 - 이 화면은 다문장
    // 전용이므로 대시보드로 되돌린다.
    if (loaded && loaded.sentences.length <= 1) {
      router.replace("/");
    }
  }, [params.id, router]);

  if (session === undefined || (session && session.sentences.length <= 1)) {
    return null;
  }

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

  const categoryCounts = aggregateCategoryCounts(session);
  const severityCounts = aggregateSeverityCounts(session);
  const jlptCounts = aggregateJlptDistribution(session);
  const hardestIndex = findHardestSentenceIndex(session);
  const hardestSentence = session.sentences[hardestIndex];

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 print:bg-white dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/history/${session.id}`}
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline print:hidden dark:text-zinc-300 dark:hover:text-white"
            >
              ← 문장별 결과로
            </Link>
            <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              종합 분석
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              총 {session.sentences.length}개 문장을 분석했습니다. 추가 AI
              호출 없이, 이미 나온 문장별 결과를 모아서 정리한 화면입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            aria-label="종합 분석 인쇄"
            className="shrink-0 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 print:hidden dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            🖨️ 인쇄
          </button>
        </header>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            심각도 분포
          </h2>
          <ul className="flex flex-wrap gap-2">
            {(["critical", "warning", "info"] as const).map((severity) => (
              <li
                key={severity}
                className={`rounded-full px-3 py-1 text-sm font-medium ${SEVERITY_STYLE[severity]}`}
              >
                {SEVERITY_LABEL[severity]} {severityCounts[severity]}건
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            전체 오류 통계
          </h2>
          {categoryCounts.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              지적된 카테고리가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {categoryCounts.map(({ category, count }) => (
                <li key={category} className="flex items-center gap-2 text-sm">
                  <span className="w-28 shrink-0 truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {category.replace(/_/g, " ")}
                  </span>
                  {/* 실제 너비가 있는 트랙(div, w-full) 위에 채움 막대를 얹는
                      방식 - percentage width가 flex 자식(span)에 걸려 있던
                      구조보다 확실하게 렌더링된다. */}
                  <div className="h-3 flex-1 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                      style={{
                        width: `${Math.max((count / categoryCounts[0].count) * 100, 8)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-zinc-500 dark:text-zinc-400">
                    {count}건
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            난이도 분포
          </h2>
          <ul className="mb-3 flex flex-wrap gap-2">
            {(Object.keys(jlptCounts) as (keyof typeof jlptCounts)[])
              .filter((level) => jlptCounts[level] > 0)
              .map((level) => (
                <li
                  key={level}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${JLPT_STYLE[level]}`}
                >
                  {level} {jlptCounts[level]}문장
                </li>
              ))}
          </ul>
          <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/20">
            <p className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
              가장 어려웠던 문장 ({hardestIndex + 1}번째,{" "}
              {hardestSentence.report.difficulty.level})
            </p>
            <p className="text-zinc-700 dark:text-zinc-300">
              {hardestSentence.sourceText}
            </p>
            <Link
              href={`/history/${session.id}`}
              className="mt-1 inline-block text-xs text-zinc-600 hover:text-zinc-900 hover:underline print:hidden dark:text-zinc-300 dark:hover:text-white"
            >
              해당 문장 결과 보기
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            문장별 총평
          </h2>
          <ol className="flex flex-col gap-3">
            {session.sentences.map((sentence, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800"
              >
                <p className="mb-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                  {i + 1}번째 문장
                </p>
                <dl className="flex flex-col gap-1">
                  <div>
                    <dt className="inline font-medium text-zinc-900 dark:text-zinc-100">
                      원문:
                    </dt>{" "}
                    <dd className="inline text-zinc-700 dark:text-zinc-300">
                      {sentence.sourceText}
                    </dd>
                  </div>
                  {sentence.report.suggested_translations[0] ? (
                    <div>
                      <dt className="mb-1 font-medium text-zinc-900 dark:text-zinc-100">
                        번역 비교 (내 번역 vs AI 번역):
                      </dt>
                      <dd>
                        <TranslationComparison
                          base={sentence.userTranslation}
                          alternative={sentence.report.suggested_translations[0]}
                        />
                      </dd>
                    </div>
                  ) : (
                    <div>
                      <dt className="inline font-medium text-zinc-900 dark:text-zinc-100">
                        내 번역:
                      </dt>{" "}
                      <dd className="inline text-zinc-700 dark:text-zinc-300">
                        {sentence.userTranslation}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline font-medium text-zinc-900 dark:text-zinc-100">
                      평가:
                    </dt>{" "}
                    <dd className="inline text-zinc-700 dark:text-zinc-300">
                      {sentence.report.overall_comment}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </section>

        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="완료하고 대시보드로 이동"
          className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 print:hidden dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          완료
        </button>
      </main>
    </div>
  );
}
