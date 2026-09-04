"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { GrammarPoint, VocabularyItem } from "@/lib/analysis-schema";
import { deleteSession, getSession, loadSessions, type HistorySession } from "@/lib/history";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { SEVERITY_LABEL, SEVERITY_ORDER, SEVERITY_STYLE } from "@/lib/severity-style";
import {
  aggregateSeverityCounts,
  compareSessions,
  findPreviousSession,
} from "@/lib/session-summary";
import { TranslationComparison } from "@/components/TranslationComparison";

const PROVIDER_LABEL: Record<HistorySession["provider"], string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

const DIRECTION_BADGE: Record<HistorySession["direction"], string> = {
  ja_to_ko: "일→한",
  ko_to_ja: "한→일",
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VocabularyRow({ item }: { item: VocabularyItem }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {item.level && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${JLPT_STYLE[item.level]}`}
        >
          {item.level}
        </span>
      )}
      <div className="text-sm">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.word}</span>
        {item.reading && (
          <span className="ml-1 text-zinc-500 dark:text-zinc-400">({item.reading})</span>
        )}
        <span className="text-zinc-600 dark:text-zinc-400"> — {item.meaning}</span>
      </div>
    </li>
  );
}

function PointCard({
  point,
  sentenceLabel,
}: {
  point: GrammarPoint;
  sentenceLabel: string | null;
}) {
  const isCritical = point.severity === "critical";
  return (
    <li
      className={`rounded-lg border p-4 ${
        isCritical
          ? "border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
          {point.category.replace(/_/g, " ")}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[point.severity]}`}
        >
          {SEVERITY_LABEL[point.severity]}
        </span>
        {sentenceLabel && (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">{sentenceLabel}</span>
        )}
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">원문:</span>{" "}
        {point.source_expression}
        {point.user_expression && (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">번역:</span>{" "}
            {point.user_expression}
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{point.comment}</p>
      {point.suggestion && (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          제안: {point.suggestion}
        </p>
      )}
    </li>
  );
}

export default function SessionReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<HistorySession | null | undefined>(
    undefined,
  );
  const [previous, setPrevious] = useState<HistorySession | null>(null);

  useEffect(() => {
    // 클라이언트 전용 localStorage를 마운트 후 한 번만 읽는다 (SSR/hydration 안전).
    const loaded = getSession(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loaded);
    if (loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevious(findPreviousSession(loadSessions(), loaded));
    }
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

  const total = session.sentences.length;
  const fullSourceText = session.sentences.map((s) => s.sourceText).join(" ");
  const severityCounts = aggregateSeverityCounts(session);

  const allStrengths = session.sentences.flatMap((s, i) =>
    s.report.strengths.map((text) => ({ text, sentenceIndex: i })),
  );

  const allPoints = session.sentences
    .flatMap((s, i) => s.report.grammar_points.map((point) => ({ point, sentenceIndex: i })))
    .sort((a, b) => SEVERITY_ORDER[a.point.severity] - SEVERITY_ORDER[b.point.severity]);

  const allVocabulary = session.sentences.flatMap((s) => s.report.vocabulary_diff);

  const comparison = previous ? compareSessions(session, previous) : null;

  function handleDeleteSession() {
    if (!session) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    deleteSession(session.id);
    router.push("/history");
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 print:bg-white dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline print:hidden dark:text-zinc-300 dark:hover:text-white"
            >
              ← 대시보드로
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {DIRECTION_BADGE[session.direction]}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {PROVIDER_LABEL[session.provider]}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">
                {formatDate(session.createdAt)}
              </span>
              {total > 1 && (
                <span className="text-zinc-400 dark:text-zinc-500">· 총 {total}개 문장</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              aria-label="리포트 인쇄"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              🖨️ 인쇄
            </button>
            <button
              type="button"
              aria-label="이 기록 삭제"
              onClick={handleDeleteSession}
              className="text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
            >
              기록 삭제
            </button>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            전체 원문
          </h2>
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {fullSourceText}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            내 번역 vs AI 번역
          </h2>
          <ul className="flex flex-col gap-3">
            {session.sentences.map((sentence, i) => {
              const aiTranslation = sentence.report.suggested_translations[0];
              return (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  {total > 1 && (
                    <p className="mb-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500">
                      {i + 1}번째 문장
                    </p>
                  )}
                  {aiTranslation ? (
                    <TranslationComparison
                      base={sentence.userTranslation}
                      alternative={aiTranslation}
                    />
                  ) : (
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      {sentence.userTranslation}
                      <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                        (AI가 이미 자연스럽다고 판단했습니다)
                      </span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            가장 잘한 점
          </h2>
          {allStrengths.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              이번엔 특별히 강조할 점을 찾지 못했습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {allStrengths.map(({ text, sentenceIndex }, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300"
                >
                  {text}
                  {total > 1 && (
                    <span className="ml-2 text-xs text-emerald-600/70 dark:text-emerald-400/70">
                      ({sentenceIndex + 1}번째 문장)
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            아쉬운 점
            {(["critical", "warning", "info"] as const).map((severity) => (
              <span
                key={severity}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[severity]}`}
              >
                {SEVERITY_LABEL[severity]} {severityCounts[severity]}
              </span>
            ))}
          </h2>
          {allPoints.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              특별히 짚을 만한 지적 사항이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {allPoints.map(({ point, sentenceIndex }, i) => (
                <PointCard
                  key={i}
                  point={point}
                  sentenceLabel={total > 1 ? `${sentenceIndex + 1}번째 문장` : null}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            이전 세션 대비 나아진 점
          </h2>
          {!comparison ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              첫 연습 기록이라 비교할 이전 기록이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              <li>
                심각 오류: {severityCounts.critical - comparison.criticalDelta}건 →{" "}
                {severityCounts.critical}건
                {comparison.criticalDelta < 0 && (
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">개선됨</span>
                )}
              </li>
              <li>
                경고: {severityCounts.warning - comparison.warningDelta}건 →{" "}
                {severityCounts.warning}건
                {comparison.warningDelta < 0 && (
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">개선됨</span>
                )}
              </li>
              {comparison.resolvedCategories.length > 0 && (
                <li>
                  지난번 지적됐던{" "}
                  {comparison.resolvedCategories.map((c) => c.replace(/_/g, " ")).join(", ")}{" "}
                  문제가 이번엔 나오지 않았습니다.
                </li>
              )}
              {comparison.criticalDelta >= 0 &&
                comparison.warningDelta >= 0 &&
                comparison.resolvedCategories.length === 0 && (
                  <li className="text-zinc-500 dark:text-zinc-400">
                    지난 세션과 비슷한 수준입니다.
                  </li>
                )}
            </ul>
          )}
        </section>

        {allVocabulary.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              핵심 단어
            </h2>
            <ul className="flex flex-col gap-2">
              {allVocabulary.map((item, i) => (
                <VocabularyRow key={i} item={item} />
              ))}
            </ul>
          </section>
        )}

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
