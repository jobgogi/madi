import { JLPT_LEVELS, type JlptLevel, type Severity } from "@/lib/analysis-schema";
import type { HistorySession } from "@/lib/history";

// 종합 분석 페이지의 모든 집계는 이미 저장된 문장별 결과를 클라이언트에서
// 합산하는 것뿐 - 추가 LLM 호출은 없다.

export interface CategoryCount {
  category: string;
  count: number;
}

export function aggregateCategoryCounts(session: HistorySession): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const sentence of session.sentences) {
    for (const point of sentence.report.grammar_points) {
      counts.set(point.category, (counts.get(point.category) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export function aggregateSeverityCounts(
  session: HistorySession,
): Record<Severity, number> {
  const counts: Record<Severity, number> = { critical: 0, warning: 0, info: 0 };
  for (const sentence of session.sentences) {
    for (const point of sentence.report.grammar_points) {
      counts[point.severity]++;
    }
  }
  return counts;
}

export function aggregateJlptDistribution(
  session: HistorySession,
): Record<JlptLevel, number> {
  const counts: Record<JlptLevel, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  for (const sentence of session.sentences) {
    counts[sentence.report.difficulty.level]++;
  }
  return counts;
}

// JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"]이므로 인덱스가 그대로 순위가
// 된다 (N5=0 가장 쉬움 ~ N1=4 가장 어려움). 순위가 가장 높은(가장 어려운)
// 첫 문장의 인덱스를 찾는다.
const JLPT_RANK: Record<JlptLevel, number> = Object.fromEntries(
  JLPT_LEVELS.map((level, i) => [level, i]),
) as Record<JlptLevel, number>;

export function findHardestSentenceIndex(session: HistorySession): number {
  let hardestIndex = 0;
  let hardestRank = -1;
  session.sentences.forEach((sentence, i) => {
    const rank = JLPT_RANK[sentence.report.difficulty.level];
    if (rank > hardestRank) {
      hardestRank = rank;
      hardestIndex = i;
    }
  });
  return hardestIndex;
}
