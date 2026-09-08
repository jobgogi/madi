import { describe, expect, it } from "vitest";
import { directionForLanguage } from "./native-language";

describe("directionForLanguage", () => {
  it("maps Korean native speakers to ja_to_ko", () => {
    expect(directionForLanguage("ko")).toBe("ja_to_ko");
  });

  it("maps Japanese native speakers to ko_to_ja", () => {
    expect(directionForLanguage("ja")).toBe("ko_to_ja");
  });
});
