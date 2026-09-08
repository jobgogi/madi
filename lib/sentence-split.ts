// \s* 대신 \s+를 써야 한다 - 빈 문자열도 매치되는 \s*는 "Vue.js", "3.14"처럼
// 마침표 뒤에 공백 없이 글자가 바로 오는 경우까지 문장으로 쪼개버렸다.
// 공백(또는 문자열 끝)이 실제로 뒤따를 때만 문장 경계로 본다.
const SENTENCE_END_RE = /(?<=[.!?。！？])\s+/;

export function splitIntoSentences(text: string): string[] {
  return text
    .split(SENTENCE_END_RE)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export interface SentencePair {
  source: string;
  translation: string;
}

// 원문/번역을 문장 단위로 나눠서 순서대로 짝짓는다. 문장 수가 서로
// 다르면(정렬이 어긋날 위험) 정렬을 시도하지 않고 통째로 한 쌍으로
// 되돌린다 - 잘못 짝지어진 문장쌍을 분석하는 것보다 안전하다.
export function pairSentences(
  sourceText: string,
  userTranslation: string,
): SentencePair[] {
  const sourceSentences = splitIntoSentences(sourceText);
  const translationSentences = splitIntoSentences(userTranslation);

  if (
    sourceSentences.length > 1 &&
    sourceSentences.length === translationSentences.length
  ) {
    return sourceSentences.map((source, i) => ({
      source,
      translation: translationSentences[i],
    }));
  }

  return [{ source: sourceText.trim(), translation: userTranslation.trim() }];
}
