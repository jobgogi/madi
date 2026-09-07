import { DIRECTIONS } from "@/lib/analysis-schema";
import { buildActivityGrid, categoryCounts, type ActivityDay, type CategoryCount } from "@/lib/dashboard-stats";
import type { HistorySession } from "@/lib/history";
import { useSessions } from "./useSessions";

export const DIRECTION_FILTER_OPTIONS = ["all", ...DIRECTIONS] as const;
export type DirectionFilter = (typeof DIRECTION_FILTER_OPTIONS)[number];

export interface DashboardData {
  activityGrid: ActivityDay[][];
  categories: CategoryCount[];
  recent: HistorySession[];
}

// 대시보드 화면의 데이터 계층 - localStorage 조회(useSessions) + 방향
// 필터링 + 잔디그래프/카테고리집계/최근기록 계산을 한데 묶는다. 로딩
// 중에는 null을 반환한다.
export function useDashboardData(
  direction: DirectionFilter,
  weeks = 14,
  recentLimit = 5,
): DashboardData | null {
  const [sessions] = useSessions();
  if (sessions === null) return null;

  const filtered = direction === "all" ? sessions : sessions.filter((s) => s.direction === direction);
  return {
    activityGrid: buildActivityGrid(filtered, weeks),
    categories: categoryCounts(filtered),
    recent: [...filtered].sort((a, b) => b.createdAt - a.createdAt).slice(0, recentLimit),
  };
}
