import { describe, expect, it } from "vitest";
import { buildAdminUserRows } from "./admin-users";

describe("buildAdminUserRows", () => {
  it("최근 가입순으로 정렬하고, 최신 로그인 시각을 붙이고, 본인 row를 표시한다", () => {
    const profiles = [
      { id: "u1", role: "user" as const, created_at: "2026-09-01T00:00:00Z", native_language: null },
      { id: "u2", role: "admin" as const, created_at: "2026-09-03T00:00:00Z", native_language: null },
    ];
    const loginHistory = [
      { user_id: "u1", logged_in_at: "2026-09-05T00:00:00Z" },
      { user_id: "u1", logged_in_at: "2026-09-08T00:00:00Z" },
      { user_id: "u2", logged_in_at: "2026-09-04T00:00:00Z" },
    ];

    const rows = buildAdminUserRows(profiles, loginHistory, "u2");

    expect(rows.map((r) => r.id)).toEqual(["u2", "u1"]);
    expect(rows.find((r) => r.id === "u1")?.lastLoginAt).toBe("2026-09-08T00:00:00Z");
    expect(rows.find((r) => r.id === "u2")?.isSelf).toBe(true);
    expect(rows.find((r) => r.id === "u1")?.isSelf).toBe(false);
  });

  it("로그인 기록이 없는 사용자는 lastLoginAt이 null이다", () => {
    const profiles = [{ id: "u1", role: "user" as const, created_at: "2026-09-01T00:00:00Z", native_language: null }];
    const rows = buildAdminUserRows(profiles, [], "u1");
    expect(rows[0].lastLoginAt).toBeNull();
  });

  it("native_language를 그대로 전달한다(null 포함)", () => {
    const profiles = [
      { id: "u1", role: "user" as const, created_at: "2026-09-01T00:00:00Z", native_language: "ko" as const },
      { id: "u2", role: "user" as const, created_at: "2026-09-02T00:00:00Z", native_language: "ja" as const },
      { id: "u3", role: "user" as const, created_at: "2026-09-03T00:00:00Z", native_language: null },
    ];
    const rows = buildAdminUserRows(profiles, [], "u1");
    expect(rows.find((r) => r.id === "u1")?.nativeLanguage).toBe("ko");
    expect(rows.find((r) => r.id === "u2")?.nativeLanguage).toBe("ja");
    expect(rows.find((r) => r.id === "u3")?.nativeLanguage).toBeNull();
  });
});
