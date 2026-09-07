import type { Severity } from "@/lib/analysis-schema";
import type { HistorySession } from "@/lib/history";

// 리포트 화면의 모든 집계는 이미 저장된 문장별 결과를 클라이언트에서
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

// "이전 세션 대비 나아진 점" - 같은 방향으로 연습했던 가장 최근 이전 세션을 찾는다.
export function findPreviousSession(
  sessions: HistorySession[],
  current: HistorySession,
): HistorySession | null {
  return (
    sessions
      .filter(
        (s) =>
          s.direction === current.direction &&
          s.id !== current.id &&
          s.createdAt < current.createdAt,
      )
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
  );
}

export interface SessionComparison {
  criticalDelta: number; // 음수 = critical 건수 감소(개선)
  warningDelta: number;
  resolvedCategories: string[]; // 직전 세션엔 있었지만 이번엔 안 나온 카테고리
}

export function compareSessions(
  current: HistorySession,
  previous: HistorySession,
): SessionComparison {
  const curSeverity = aggregateSeverityCounts(current);
  const prevSeverity = aggregateSeverityCounts(previous);
  const curCategories = new Set(aggregateCategoryCounts(current).map((c) => c.category));
  const prevCategories = aggregateCategoryCounts(previous).map((c) => c.category);
  return {
    criticalDelta: curSeverity.critical - prevSeverity.critical,
    warningDelta: curSeverity.warning - prevSeverity.warning,
    resolvedCategories: prevCategories.filter((c) => !curCategories.has(c)),
  };
}
