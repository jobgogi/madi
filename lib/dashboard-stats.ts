import { POINT_CATEGORIES, type Direction } from "./analysis-schema";
import { localDateKey } from "./date-key";
import type { HistorySession } from "./history";
import type { NativeLanguage } from "./native-language";

export type PointCategory = (typeof POINT_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<NativeLanguage, Record<PointCategory, string>> = {
  ko: {
    조사_오용: "조사 오용",
    경어_레벨_오류: "경어 레벨 오류",
    어순_문제: "어순 문제",
    시제_상_오류: "시제·상 오류",
    활용형_오류: "활용형 오류",
    조수사_오류: "조수사 오류",
    어휘_선택_오류: "어휘 선택 오류",
    생략_보충_오류: "생략·보충 오류",
    문형_오류: "문형 오류",
    뉘앙스_오류: "뉘앙스 오류",
  },
  ja: {
    조사_오용: "助詞の誤用",
    경어_레벨_오류: "敬語レベルの誤り",
    어순_문제: "語順の問題",
    시제_상_오류: "時制・相の誤り",
    활용형_오류: "活用形の誤り",
    조수사_오류: "助数詞の誤り",
    어휘_선택_오류: "語彙選択の誤り",
    생략_보충_오류: "省略・補足の誤り",
    문형_오류: "文型の誤り",
    뉘앙스_오류: "ニュアンスの誤り",
  },
};

export interface ActivityDay {
  date: string; // YYYY-MM-DD (로컬 기준)
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

function levelFor(count: number): ActivityDay["level"] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

// GitHub 컨트리뷰션 그래프 스타일: weeks열 x 7행(일~토), 마지막 열은 이번 주
// 토요일까지 채워서 항상 완전한 주 단위로 정렬한다.
export function buildActivityGrid(
  sessions: HistorySession[],
  weeks: number,
  today: Date = new Date(),
): ActivityDay[][] {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = localDateKey(new Date(session.createdAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const gridEnd = new Date(todayMidnight);
  gridEnd.setDate(gridEnd.getDate() + (6 - todayMidnight.getDay()));
  const gridStart = new Date(gridEnd);
  gridStart.setDate(gridStart.getDate() - (weeks * 7 - 1));

  const grid: ActivityDay[][] = Array.from({ length: weeks }, () => []);
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    const future = d > todayMidnight;
    const count = future ? 0 : (counts.get(key) ?? 0);
    grid[Math.floor(i / 7)].push({ date: key, count, level: levelFor(count), future });
  }
  return grid;
}

// 잔디 그래프 위에 표시할 월 라벨 - 각 열의 첫째 날(일요일) 기준으로 월이
// 바뀌는 열에만 1~12 값을 반환하고, 나머지 열은 null(라벨 없음).
export function monthLabels(grid: ActivityDay[][]): (number | null)[] {
  let lastMonth = -1;
  return grid.map((week) => {
    const month = Number(week[0].date.slice(5, 7));
    if (month === lastMonth) return null;
    lastMonth = month;
    return month;
  });
}

export interface CategoryCount {
  category: PointCategory;
  count: number;
}

// 카테고리별 오류 빈도 - 건수 내림차순, 0건인 카테고리는 제외.
export function categoryCounts(
  sessions: HistorySession[],
  direction: Direction | "all" = "all",
): CategoryCount[] {
  const counts = new Map<PointCategory, number>();
  for (const session of sessions) {
    if (direction !== "all" && session.direction !== direction) continue;
    for (const sentence of session.sentences) {
      for (const point of sentence.report.grammar_points) {
        counts.set(point.category, (counts.get(point.category) ?? 0) + 1);
      }
    }
  }
  return POINT_CATEGORIES.map((category) => ({ category, count: counts.get(category) ?? 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

// 특정 카테고리의 오류가 하나라도 있는 세션만 남긴다.
export function filterSessionsByCategory(
  sessions: HistorySession[],
  category: PointCategory,
): HistorySession[] {
  return sessions.filter((s) =>
    s.sentences.some((sentence) => sentence.report.grammar_points.some((p) => p.category === category)),
  );
}
