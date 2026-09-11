import { describe, expect, it } from "vitest";
import { countByDirection, countByProvider, signupsByDay } from "./admin-stats";

describe("countByDirection", () => {
  it("방향별 건수를 집계한다", () => {
    const reports = [{ direction: "ja_to_ko" as const }, { direction: "ja_to_ko" as const }, { direction: "ko_to_ja" as const }];
    expect(countByDirection(reports)).toEqual({ ja_to_ko: 2, ko_to_ja: 1 });
  });

  it("리포트가 없으면 모든 방향이 0이다", () => {
    expect(countByDirection([])).toEqual({ ja_to_ko: 0, ko_to_ja: 0 });
  });
});

describe("countByProvider", () => {
  it("provider별 건수를 집계한다", () => {
    const reports = [{ provider: "claude" as const }, { provider: "openai" as const }, { provider: "claude" as const }];
    expect(countByProvider(reports)).toEqual({ claude: 2, openai: 1, gemini: 0 });
  });
});

describe("signupsByDay", () => {
  const today = new Date(2026, 8, 10); // 2026-09-10

  it("최근 N일 구간을 날짜 오름차순으로 반환하고 해당일 가입 수를 센다", () => {
    const createdAts = [
      "2026-09-10T01:00:00",
      "2026-09-10T20:00:00",
      "2026-09-08T05:00:00",
      "2026-08-01T00:00:00", // 범위 밖
    ];
    const result = signupsByDay(createdAts, 3, today);
    expect(result).toEqual([
      { date: "2026-09-08", count: 1 },
      { date: "2026-09-09", count: 0 },
      { date: "2026-09-10", count: 2 },
    ]);
  });

  it("가입 데이터가 없으면 0으로 채운 구간을 반환한다", () => {
    const result = signupsByDay([], 2, today);
    expect(result).toEqual([
      { date: "2026-09-09", count: 0 },
      { date: "2026-09-10", count: 0 },
    ]);
  });
});
