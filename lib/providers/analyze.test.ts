import { describe, expect, it } from "vitest";
import { resolvePromptTemplate, LOCKED_PROMPT_RULES } from "./analyze";

describe("resolvePromptTemplate", () => {
  it("{{explanationLang}} 자리를 모국어에 맞는 언어명으로 치환한다", () => {
    const content = "설명은 {{explanationLang}}로 작성하세요. 다시 한번: {{explanationLang}}.";
    expect(resolvePromptTemplate(content, "ko")).toContain("설명은 한국어로 작성하세요. 다시 한번: 한국어.");
    expect(resolvePromptTemplate(content, "ja")).toContain("설명은 일본어로 작성하세요. 다시 한번: 일본어.");
  });

  it("플레이스홀더가 없으면 원문 뒤에 고정 규칙만 붙는다", () => {
    expect(resolvePromptTemplate("변경 없음", "ko")).toBe(`변경 없음\n\n${LOCKED_PROMPT_RULES}`);
  });

  it("관리자가 입력한 content와 무관하게 고정 규칙(카테고리/배치 처리/출력 형식)이 항상 포함된다", () => {
    const result = resolvePromptTemplate("아무 내용이나 여기 마음대로 작성", "ko");
    expect(result).toContain("조사_오용");
    expect(result).toContain("정의된 JSON 스키마 형식으로만 응답");
  });
});
