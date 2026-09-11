import { DIRECTIONS, type Direction } from "./analysis-schema";
import { localDateKey } from "./date-key";
import type { Provider } from "./settings";

const PROVIDERS: Provider[] = ["claude", "openai", "gemini"];

export function countByDirection(reports: { direction: Direction }[]): Record<Direction, number> {
  const counts = Object.fromEntries(DIRECTIONS.map((d) => [d, 0])) as Record<Direction, number>;
  for (const report of reports) counts[report.direction]++;
  return counts;
}

export function countByProvider(reports: { provider: Provider }[]): Record<Provider, number> {
  const counts = Object.fromEntries(PROVIDERS.map((p) => [p, 0])) as Record<Provider, number>;
  for (const report of reports) counts[report.provider]++;
  return counts;
}

export interface SignupDay {
  date: string; // YYYY-MM-DD
  count: number;
}

// 최근 `days`일(오늘 포함) 구간의 일별 가입자 수 - 잔디 그래프의 날짜 처리
// (lib/dashboard-stats.ts localDateKey)와 동일하게 로컬 기준 날짜로 집계한다.
export function signupsByDay(createdAts: string[], days: number, today: Date = new Date()): SignupDay[] {
  const counts = new Map<string, number>();
  for (const iso of createdAts) {
    const key = localDateKey(new Date(iso));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const result: SignupDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayMidnight);
    d.setDate(d.getDate() - i);
    const key = localDateKey(d);
    result.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return result;
}
