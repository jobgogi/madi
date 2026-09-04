// zodOutputFormat() from @anthropic-ai/sdk expects Zod v4 schemas specifically -
// import from the "zod/v4" subpath (available since zod 3.25) rather than "zod".
import { z } from "zod/v4";

// 시스템 프롬프트가 이 10개로 category를 강제한다 - 목록 밖 이름을 새로
// 만들지 못하게 여기서도 enum으로 고정.
export const POINT_CATEGORIES = [
  "조사_오용",
  "경어_레벨_오류",
  "어순_문제",
  "시제_상_오류",
  "활용형_오류",
  "조수사_오류",
  "어휘_선택_오류",
  "생략_보충_오류",
  "문형_오류",
  "뉘앙스_오류",
] as const;

export type PointCategory = (typeof POINT_CATEGORIES)[number];

// critical: 원문과 반대/다른 의미로 읽히는 경우 (의미 왜곡)
// warning: 문법 오류 또는 어조·시제 일관성 붕괴
// info: 문법은 맞지만 더 자연스러운 표현이 있는 경우
export const SEVERITIES = ["critical", "warning", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

// JLPT(일본어능력시험) 등급. N5가 가장 쉽고 N1이 가장 어려움.
export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
export type JlptLevel = (typeof JLPT_LEVELS)[number];

// .strict() (additionalProperties: false) is required for OpenAI's
// structured-outputs "strict" JSON Schema mode; Anthropic's zodOutputFormat
// accepts it too, so one schema definition serves both providers.
export const GrammarPointSchema = z
  .object({
    category: z.enum(POINT_CATEGORIES),
    source_expression: z.string().describe("원문에서 이 지적과 관련된 표현"),
    user_expression: z
      .string()
      .nullable()
      .describe("사용자 번역에서 대응하는 표현. 통째로 누락된 경우 null"),
    comment: z.string().describe("왜 이 지점을 짚었는지에 대한 설명"),
    suggestion: z.string().nullable().describe("더 나은 표현 제안. 없으면 null"),
    severity: z
      .enum(SEVERITIES)
      .describe(
        "critical: 원문과 반대/다른 의미로 읽히는 경우(부정어 누락, 주체/객체 반전 등) / warning: 문법 오류 또는 어조·시제 일관성 붕괴 / info: 문법은 맞지만 더 자연스러운 표현이 있는 경우",
      ),
  })
  .strict();

export type GrammarPoint = z.infer<typeof GrammarPointSchema>;

export const VocabularyItemSchema = z
  .object({
    word: z.string().describe("원문에 나온 단어/표현 (한자 등 원형 그대로)"),
    reading: z
      .string()
      .nullable()
      .describe("한자 읽기(요미가나/furigana). 필요 없으면 null"),
    meaning: z.string().describe("한국어 뜻"),
    level: z
      .enum(JLPT_LEVELS)
      .nullable()
      .describe("이 단어의 대략적인 JLPT 난이도. 확신이 없으면 null"),
  })
  .strict();

export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;

export const TranslationAnalysisReportSchema = z
  .object({
    difficulty: z
      .object({
        level: z
          .enum(JLPT_LEVELS)
          .describe("원문 전체의 대략적인 난이도 (JLPT 기준, N5=쉬움 ~ N1=어려움)"),
        comment: z.string().describe("왜 그 난이도로 판단했는지 짧은 설명"),
      })
      .strict(),
    overall_comment: z
      .string()
      .describe(
        "전체적인 자연스러움/완성도에 대한 짧은 총평 (점수화하지 않고 서술형으로)",
      ),
    grammar_points: z
      .array(GrammarPointSchema)
      .describe(
        "어휘·문법 관련 지적 사항 전체. severity가 critical(의미 왜곡)인 항목을 배열의 가장 앞에 배치할 것",
      ),
    vocabulary_diff: z
      .array(VocabularyItemSchema)
      .describe(
        "핵심 단어 목록. 1순위: 사용자가 오역/오용한 단어, 2순위(1순위로 채워지지 않을 때): 원문의 고난도 핵심 용어. 없으면 빈 배열",
      ),
    suggested_translations: z
      .array(z.string())
      .max(3)
      .describe("참고용 대안 번역 (정답이 아닌 예시). 1~2개 권장"),
  })
  .strict();

export type TranslationAnalysisReport = z.infer<
  typeof TranslationAnalysisReportSchema
>;
