import { describe, expect, it } from "vitest";
import { groupByDirectionSorted, idToDeactivate, nextVersion, type PromptTemplate } from "./prompt-templates";

function makeTemplate(overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  return {
    id: crypto.randomUUID(),
    direction: "ja_to_ko",
    version: 1,
    content: "prompt",
    isActive: false,
    createdAt: 0,
    ...overrides,
  };
}

describe("groupByDirectionSorted", () => {
  it("방향별로 나누고 각 그룹을 버전 내림차순으로 정렬한다", () => {
    const t1 = makeTemplate({ direction: "ja_to_ko", version: 1 });
    const t2 = makeTemplate({ direction: "ja_to_ko", version: 3 });
    const t3 = makeTemplate({ direction: "ko_to_ja", version: 2 });

    const grouped = groupByDirectionSorted([t1, t2, t3]);

    expect(grouped.ja_to_ko.map((t) => t.version)).toEqual([3, 1]);
    expect(grouped.ko_to_ja.map((t) => t.version)).toEqual([2]);
  });

  it("빈 배열이면 두 방향 모두 빈 목록을 반환한다", () => {
    const grouped = groupByDirectionSorted([]);
    expect(grouped.ja_to_ko).toEqual([]);
    expect(grouped.ko_to_ja).toEqual([]);
  });
});

describe("nextVersion", () => {
  it("해당 방향의 기존 최대 버전 + 1을 반환한다", () => {
    const templates = [
      makeTemplate({ direction: "ja_to_ko", version: 1 }),
      makeTemplate({ direction: "ja_to_ko", version: 3 }),
      makeTemplate({ direction: "ko_to_ja", version: 5 }),
    ];
    expect(nextVersion(templates, "ja_to_ko")).toBe(4);
  });

  it("해당 방향에 템플릿이 없으면 1을 반환한다", () => {
    expect(nextVersion([], "ko_to_ja")).toBe(1);
  });
});

describe("idToDeactivate", () => {
  it("같은 방향에 활성 템플릿이 있으면 그 id를 반환한다", () => {
    const active = makeTemplate({ direction: "ja_to_ko", isActive: true });
    const target = makeTemplate({ direction: "ja_to_ko", isActive: false });
    expect(idToDeactivate([active, target], target.id)).toBe(active.id);
  });

  it("대상 자신이 이미 활성 상태면 비활성화 대상이 없다(null)", () => {
    const target = makeTemplate({ direction: "ja_to_ko", isActive: true });
    expect(idToDeactivate([target], target.id)).toBeNull();
  });

  it("같은 방향에 활성 템플릿이 없으면 null을 반환한다", () => {
    const target = makeTemplate({ direction: "ja_to_ko", isActive: false });
    expect(idToDeactivate([target], target.id)).toBeNull();
  });

  it("다른 방향의 활성 템플릿은 무시한다", () => {
    const otherDirectionActive = makeTemplate({ direction: "ko_to_ja", isActive: true });
    const target = makeTemplate({ direction: "ja_to_ko", isActive: false });
    expect(idToDeactivate([otherDirectionActive, target], target.id)).toBeNull();
  });
});
