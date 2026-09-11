"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { GrammarPoint, VocabularyItem } from "@/lib/analysis-schema";
import { deleteSession, type HistorySession } from "@/lib/history";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { SEVERITY_LABEL, SEVERITY_ORDER, SEVERITY_STYLE } from "@/lib/severity-style";
import { aggregateSeverityCounts, compareSessions } from "@/lib/session-summary";
import { useHistorySession } from "@/lib/hooks/useHistorySession";
import { useSessionFeedback } from "@/lib/hooks/useSessionFeedback";
import { useLocale } from "@/lib/hooks/useLocale";
import { history } from "@/lib/i18n/history";
import { CATEGORY_LABEL, type PointCategory } from "@/lib/dashboard-stats";
import type { NativeLanguage } from "@/lib/native-language";
import { TranslationComparison } from "@/components/TranslationComparison";
import {
  PrinterIcon,
  StarIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  TrendingUpIcon,
  WarningTriangleIcon,
} from "@/components/icons";

const PROVIDER_LABEL: Record<HistorySession["provider"], string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

function formatDate(ts: number, locale: NativeLanguage): string {
  return new Date(ts).toLocaleString(locale === "ja" ? "ja-JP" : "ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function VocabularyRow({ item }: { item: VocabularyItem }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3">
      {item.level && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${JLPT_STYLE[item.level]}`}
        >
          {item.level}
        </span>
      )}
      <div className="text-sm">
        <span className="font-medium text-zinc-900">{item.word}</span>
        {item.reading && (
          <span className="ml-1 text-zinc-500">({item.reading})</span>
        )}
        <span className="text-zinc-600"> — {item.meaning}</span>
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
  const locale = useLocale();
  const t = history[locale];
  const isCritical = point.severity === "critical";
  return (
    <li
      className={`rounded-lg border p-4 ${
        isCritical
          ? "border-red-300 bg-red-50/50"
          : "border-zinc-200"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
          {CATEGORY_LABEL[locale][point.category]}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[point.severity]}`}
        >
          {SEVERITY_LABEL[locale][point.severity]}
        </span>
        {sentenceLabel && (
          <span className="text-xs text-zinc-400">{sentenceLabel}</span>
        )}
      </div>
      <p className="text-sm text-zinc-700">
        <span className="font-medium text-zinc-900">{t.sourceLabel}</span>{" "}
        {point.source_expression}
        {point.user_expression && (
          <>
            {" "}
            <span className="font-medium text-zinc-900">{t.translationLabel}</span>{" "}
            {point.user_expression}
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-zinc-600">{point.comment}</p>
      {point.suggestion && (
        <p className="mt-2 text-sm text-emerald-700">
          {t.suggestionPrefix}{point.suggestion}
        </p>
      )}
    </li>
  );
}

export default function SessionReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { session, previous } = useHistorySession(params.id);
  const { feedback, setFeedback } = useSessionFeedback(session?.id ?? null);
  const locale = useLocale();
  const t = history[locale];

  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
        <main className="flex w-full max-w-2xl flex-col gap-4">
          <p className="text-sm text-zinc-500">
            {t.notFound}
          </p>
          <Link href="/dashboard" className="text-sm underline">
            {t.backToDashboardLong}
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

  async function handleDeleteSession() {
    if (!session) return;
    if (!window.confirm(t.confirmDelete)) return;
    await deleteSession(session.id);
    router.push("/history");
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 print:bg-white">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline print:hidden"
            >
              {t.backToDashboard}
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                {t.directionBadge[session.direction]}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                {PROVIDER_LABEL[session.provider]}
              </span>
              {typeof session.promptVersion === "number" && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                  prompt v{session.promptVersion}
                </span>
              )}
              <span className="text-zinc-400">
                {formatDate(session.createdAt, locale)}
              </span>
              {total > 1 && (
                <span className="text-zinc-400">{t.totalSentences(total)}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => setFeedback("good")}
              aria-label={t.feedbackGood}
              aria-pressed={feedback === "good"}
              className={`flex items-center gap-1.5 text-sm ${
                feedback === "good" ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <ThumbsUpIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setFeedback("bad")}
              aria-label={t.feedbackBad}
              aria-pressed={feedback === "bad"}
              className={`flex items-center gap-1.5 text-sm ${
                feedback === "bad" ? "text-red-600" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <ThumbsDownIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              aria-label={t.print}
              className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900"
            >
              <PrinterIcon className="h-4 w-4" /> {t.print}
            </button>
            <button
              type="button"
              aria-label={t.deleteRecord}
              onClick={handleDeleteSession}
              className="text-sm text-zinc-500 hover:text-red-600"
            >
              {t.deleteRecord}
            </button>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            {t.fullSourceTitle}
          </h2>
          <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800">
            {fullSourceText}
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900">
            {t.comparisonTitle}
          </h2>
          <ul className="flex flex-col gap-3">
            {session.sentences.map((sentence, i) => {
              const aiTranslation = sentence.report.suggested_translations[0];
              return (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 p-3"
                >
                  {total > 1 && (
                    <p className="mb-1.5 text-xs font-medium text-zinc-400">
                      {t.nthSentence(i + 1)}
                    </p>
                  )}
                  {aiTranslation ? (
                    <TranslationComparison
                      baseLabel={t.myTranslation}
                      base={sentence.userTranslation}
                      altLabel={t.aiSuggestion}
                      alternative={aiTranslation}
                    />
                  ) : (
                    <p className="text-sm text-zinc-700">
                      {sentence.userTranslation}
                      <span className="ml-2 text-xs text-zinc-400">
                        {t.alreadyNatural}
                      </span>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-zinc-500">
                    {t.overallCommentPrefix}{sentence.report.overall_comment}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
            <StarIcon className="h-4 w-4" /> {t.strengthsTitle}
          </h2>
          {allStrengths.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t.noStrengths}
            </p>
          ) : (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
              <ul className="flex flex-col gap-2">
                {allStrengths.map(({ text, sentenceIndex }, i) => (
                  <li key={i} className="text-sm text-emerald-800">
                    {text}
                    {total > 1 && (
                      <span className="ml-2 text-xs text-emerald-600/70">
                        ({t.nthSentence(sentenceIndex + 1)})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-red-300 bg-red-50/40 p-3">
          <h2 className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
            <WarningTriangleIcon className="h-4 w-4" /> {t.weakPointsTitle}
            {(["critical", "warning", "info"] as const).map((severity) => (
              <span
                key={severity}
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_STYLE[severity]}`}
              >
                {SEVERITY_LABEL[locale][severity]} {severityCounts[severity]}
              </span>
            ))}
          </h2>
          {allPoints.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {t.noWeakPoints}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {allPoints.map(({ point, sentenceIndex }, i) => (
                <PointCard
                  key={i}
                  point={point}
                  sentenceLabel={total > 1 ? t.nthSentence(sentenceIndex + 1) : null}
                />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
            <TrendingUpIcon className="h-4 w-4" /> {t.progressTitle}
          </h2>
          {!comparison ? (
            <p className="text-sm text-zinc-500">
              {t.noPrevious}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 rounded-lg border-2 border-zinc-900 p-3 text-sm text-zinc-700">
              <li>
                {t.criticalCountLine(
                  severityCounts.critical - comparison.criticalDelta,
                  severityCounts.critical,
                )}
                {comparison.criticalDelta < 0 && (
                  <span className="ml-1 text-emerald-600">{t.improved}</span>
                )}
              </li>
              <li>
                {t.warningCountLine(
                  severityCounts.warning - comparison.warningDelta,
                  severityCounts.warning,
                )}
                {comparison.warningDelta < 0 && (
                  <span className="ml-1 text-emerald-600">{t.improved}</span>
                )}
              </li>
              {comparison.resolvedCategories.length > 0 && (
                <li>
                  {t.resolvedCategories(
                    comparison.resolvedCategories
                      .map((c) => CATEGORY_LABEL[locale][c as PointCategory])
                      .join(", "),
                  )}
                </li>
              )}
              {comparison.criticalDelta >= 0 &&
                comparison.warningDelta >= 0 &&
                comparison.resolvedCategories.length === 0 && (
                  <li className="text-zinc-500">
                    {t.similarToPrevious}
                  </li>
                )}
            </ul>
          )}
        </section>

        {allVocabulary.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              {t.vocabularyTitle}
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
          onClick={() => router.push("/dashboard")}
          aria-label={t.doneAria}
          className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 print:hidden"
        >
          {t.done}
        </button>
      </main>
    </div>
  );
}
