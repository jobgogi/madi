import type {
  GrammarPoint,
  TranslationAnalysisReport,
  VocabularyItem,
} from "@/lib/analysis-schema";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { SEVERITY_LABEL, SEVERITY_ORDER, SEVERITY_STYLE } from "@/lib/severity-style";
import { TranslationComparison } from "@/components/TranslationComparison";

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
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {item.word}
        </span>
        {item.reading && (
          <span className="ml-1 text-zinc-500 dark:text-zinc-400">
            ({item.reading})
          </span>
        )}
        <span className="text-zinc-600 dark:text-zinc-400"> — {item.meaning}</span>
      </div>
    </li>
  );
}

function PointCard({ point }: { point: GrammarPoint }) {
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
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          원문:
        </span>{" "}
        {point.source_expression}
        {point.user_expression && (
          <>
            {" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              번역:
            </span>{" "}
            {point.user_expression}
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {point.comment}
      </p>
      {point.suggestion && (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          제안: {point.suggestion}
        </p>
      )}
    </li>
  );
}

export function AnalysisReportView({
  report,
  userTranslation,
}: {
  report: TranslationAnalysisReport;
  userTranslation: string;
}) {
  const sortedPoints = [...report.grammar_points].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          난이도
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${JLPT_STYLE[report.difficulty.level]}`}
          >
            {report.difficulty.level}
          </span>
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {report.difficulty.comment}
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          총평
        </h2>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {report.overall_comment}
        </p>
      </section>

      {sortedPoints.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            번역 포인트
          </h2>
          <ul className="flex flex-col gap-3">
            {sortedPoints.map((point, i) => (
              <PointCard key={i} point={point} />
            ))}
          </ul>
        </section>
      )}

      {sortedPoints.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          특별히 짚을 만한 지적 사항이 없습니다.
        </p>
      )}

      {report.vocabulary_diff.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            핵심 단어
          </h2>
          <ul className="flex flex-col gap-2">
            {report.vocabulary_diff.map((item, i) => (
              <VocabularyRow key={i} item={item} />
            ))}
          </ul>
        </section>
      )}

      {report.suggested_translations.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            참고 대안 번역과 비교
          </h2>
          <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded bg-red-100 px-1 text-red-700 line-through dark:bg-red-900/40 dark:text-red-300">
              빨간 취소선
            </span>
            은 내 번역에만 있는 부분,{" "}
            <span className="rounded bg-emerald-100 px-1 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              초록 강조
            </span>
            는 제안에만 있는 부분입니다. 대안일 뿐 정답은 아닙니다.
          </p>
          <ul className="flex flex-col gap-2">
            {report.suggested_translations.map((t, i) => (
              <li
                key={i}
                className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <TranslationComparison base={userTranslation} alternative={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
