import { describe, expect, it } from "vitest";
import { buildActivityGrid, categoryCounts } from "./dashboard-stats";
import type { HistorySession } from "./history";

function makeSession(
  createdAt: number,
  direction: HistorySession["direction"] = "ja_to_ko",
): HistorySession {
  return {
    id: crypto.randomUUID(),
    createdAt,
    schemaVersion: 3,
    provider: "claude",
    direction,
    sentences: [
      {
        sourceText: "s",
        userTranslation: "t",
        report: {
          difficulty: { level: "N3", comment: "" },
          overall_comment: "",
          strengths: [],
          grammar_points: [
            {
              category: "조사_오용",
              source_expression: "",
              user_expression: null,
              comment: "",
              suggestion: null,
              severity: "warning",
            },
          ],
          vocabulary_diff: [],
          suggested_translations: [],
        },
      },
    ],
  };
}

const today = new Date(2026, 8, 7); // 2026-09-07 (월)

describe("buildActivityGrid", () => {
  it("returns weeks x 7 grid ending on today's column", () => {
    const grid = buildActivityGrid([makeSession(today.getTime())], 14, today);
    expect(grid).toHaveLength(14);
    expect(grid[0]).toHaveLength(7);
    expect(grid[13][today.getDay()].count).toBe(1);
    expect(grid[13][today.getDay()].level).toBe(1);
    expect(grid[0][0].count).toBe(0);
  });

  it("buckets daily counts into levels", () => {
    const busyDay = new Date(2026, 8, 1);
    const busySessions = Array.from({ length: 5 }, () => makeSession(busyDay.getTime()));
    const grid = buildActivityGrid(busySessions, 14, today);
    const busyCell = grid.flat().find((d) => d.count === 5);
    expect(busyCell?.level).toBe(3);
  });

  it("marks dates after today as future", () => {
    const grid = buildActivityGrid([], 14, today);
    const last = grid[13][6];
    expect(last.future).toBe(last.date > `${today.getFullYear()}-09-07`);
  });
});

describe("categoryCounts", () => {
  it("aggregates across sessions and filters by direction", () => {
    const mixed = [makeSession(Date.now(), "ja_to_ko"), makeSession(Date.now(), "ko_to_ja")];
    expect(categoryCounts(mixed)[0].count).toBe(2);
    expect(categoryCounts(mixed, "ja_to_ko")[0].count).toBe(1);
  });

  it("returns an empty list when there is nothing to count", () => {
    expect(categoryCounts([])).toEqual([]);
  });
});
