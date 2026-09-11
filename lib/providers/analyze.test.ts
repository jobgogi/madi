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

  it("{{readingGuidance}}는 모국어가 일본어면 가타카나 안내로 치환된다", () => {
    expect(resolvePromptTemplate("규칙: {{readingGuidance}}", "ja")).toContain("가타카나");
  });

  it("{{readingGuidance}}는 모국어가 한국어면 후리가나 안내로 치환된다", () => {
    expect(resolvePromptTemplate("규칙: {{readingGuidance}}", "ko")).toContain("한자 요미가나");
  });

  it("{{vocabularyLanguage}}는 모국어의 반대쪽 언어를 word 언어로 지정한다", () => {
    expect(resolvePromptTemplate("{{vocabularyLanguage}}", "ko")).toContain("word는 반드시 일본어 표현");
    expect(resolvePromptTemplate("{{vocabularyLanguage}}", "ja")).toContain("word는 반드시 한국어 표현");
  });

  it("{{difficultyGuidance}}는 모국어의 반대쪽 언어 기준으로 JLPT/TOPIK 척도를 정한다", () => {
    expect(resolvePromptTemplate("{{difficultyGuidance}}", "ko")).toContain("JLPT");
    expect(resolvePromptTemplate("{{difficultyGuidance}}", "ja")).toContain("TOPIK");
  });
});
