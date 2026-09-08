import { describe, expect, it } from "vitest";
import { splitIntoSentences } from "./sentence-split";

describe("splitIntoSentences", () => {
  it("splits on sentence-ending punctuation followed by whitespace", () => {
    expect(splitIntoSentences("첫 문장이다. 두 번째 문장이다!")).toEqual([
      "첫 문장이다.",
      "두 번째 문장이다!",
    ]);
  });

  it("does not split inside a dotted name like Vue.js", () => {
    expect(splitIntoSentences("나는 Vue.js를 좋아한다. 그리고 Node.js도 쓴다.")).toEqual([
      "나는 Vue.js를 좋아한다.",
      "그리고 Node.js도 쓴다.",
    ]);
  });

  it("does not split a decimal number", () => {
    expect(splitIntoSentences("원주율은 3.14 정도이다.")).toEqual(["원주율은 3.14 정도이다."]);
  });
});
