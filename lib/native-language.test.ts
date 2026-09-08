import { describe, expect, it, vi } from "vitest";

// directionForLanguage는 순수 함수지만, 같은 모듈이 Supabase 클라이언트도
// export한다 - 실제 @supabase/ssr을 로드하면 이 프로젝트의 워커 테스트
// 환경과 충돌하므로 mock으로 대체한다.
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({}) }));

import { directionForLanguage } from "./native-language";

describe("directionForLanguage", () => {
  it("maps Korean native speakers to ja_to_ko", () => {
    expect(directionForLanguage("ko")).toBe("ja_to_ko");
  });

  it("maps Japanese native speakers to ko_to_ja", () => {
    expect(directionForLanguage("ja")).toBe("ko_to_ja");
  });
});
