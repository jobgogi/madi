import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
import { GoogleGenAI, ApiError as GeminiApiError } from "@google/genai";
import { z } from "zod/v4";
import {
  DIRECTION_LANG,
  TranslationAnalysisReportSchema,
  type Direction,
  type TranslationAnalysisReport,
} from "@/lib/analysis-schema";

export type Provider = "claude" | "openai" | "gemini";

const DEFAULT_MODEL: Record<Provider, string> = {
  claude: "claude-opus-5",
  // OpenAI/Gemini 모델 이름은 자주 바뀌므로, 설정 화면에서 직접 입력한 값을 우선
  // 사용한다. 이 기본값은 사용 시점에 최신 모델명인지 확인 후 필요하면 설정에서
  // 바꿔줄 것. Gemini는 무료 티어가 보통 flash 계열에 있으므로 flash를 기본값으로 둔다.
  openai: "gpt-5",
  // gemini-3.6-flash는 무료 티어 RPD(하루 요청 한도)가 20회로 매우 낮아서
  // 금방 소진됨 - 더 넉넉한 무료 할당량을 기대하고 lite 버전으로 변경.
  gemini: "gemini-3.5-flash-lite",
};

// 응답 JSON 스키마를 provider에 전달하기 전에 $schema 같은 메타 키를 제거한다.
function toResponseJsonSchema(): Record<string, unknown> {
  const { $schema, ...schema } = z.toJSONSchema(TranslationAnalysisReportSchema) as Record<
    string,
    unknown
  >;
  void $schema;
  return schema;
}

// Gemini는 특히 무료 티어에서 "high demand"로 인한 503을 자주 반환한다
// (실제 요청으로 확인됨). 짧은 대기 후 자동 재시도하면 대부분 해소된다.
function isGeminiTransientError(error: unknown): boolean {
  return (
    error instanceof GeminiApiError &&
    (error.status === 503 || error.status === 429)
  );
}

// Gemini의 일시적 503/429 오류를 짧은 대기 후 자동 재시도한다 - 분석 호출과
// "연결 테스트" 양쪽에서 공유.
async function withGeminiRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxRetries || !isGeminiTransientError(error)) {
        throw error;
      }
      const delayMs = 800 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export class AnalysisParseError extends Error {
  constructor(message = "분석 결과를 파싱하지 못했습니다.") {
    super(message);
    this.name = "AnalysisParseError";
  }
}

// 방향에 관계없이 AI가 먼저 자체 기준 번역을 만들고, 그 번역을 기준 삼아
// 사용자 번역과 비교한다 (지시 순서 원칙: 번역 -> 비교 -> 난이도 판정).
function buildSystemPrompt(direction: Direction): string {
  const { source, target } = DIRECTION_LANG[direction];
  const translateFirstRule = `
[번역 순서]
먼저 원문을 자연스러운 ${target}로 직접 번역해 기준 번역(ai_translation)을 만드세요. 그 다음 이 기준 번역을 기준 삼아 사용자의 ${target} 번역과 비교하세요.
`;
  const readingRule =
    direction === "ja_to_ko"
      ? "각 단어에는 reading(한자 읽기/요미가나, 히라가나 표기)을 병기하세요."
      : "각 단어에는 reading(한국어 단어의 일본어식 발음을 외래어 표기법 기준 가타카나로 표기)을 병기하세요. 가타카나 표기는 일관된 규칙을 따르세요.";
  const difficultyRule =
    direction === "ja_to_ko"
      ? "difficulty.level은 원문(일본어) 전체의 JLPT 기준 대략적인 난이도(N5~N1)를 판단하고, comment에 그 이유를 간단히 설명하세요."
      : "difficulty.level은 원문이 아니라 당신이 만든 기준 번역(최종 일본어 결과물) 전체의 JLPT 기준 대략적인 난이도(N5~N1)를 판단하고, comment에 그 이유를 간단히 설명하세요.";

  return `당신은 ${source}->${target} 번역 학습을 돕는 코치입니다.
사용자가 제시한 ${source} 원문과 그 사람이 직접 작성한 ${target} 번역을 비교 분석하세요.
${translateFirstRule}
[최우선 규칙: 의미 왜곡 우선 감지]
다른 무엇보다 먼저, 사용자 번역이 원문의 의미를 반대로 바꾸거나(부정어 누락/추가 등) 핵심 사실 관계를 왜곡하는 부분이 있는지 검사하세요. 이런 오류를 발견하면 severity를 반드시 "critical"로 표시하고, grammar_points 배열의 가장 첫 번째 항목으로 배치하세요. 문장이 아무리 자연스럽게 읽혀도 의미 왜곡은 반드시 지적해야 합니다.

[카테고리 규칙]
grammar_points의 category는 반드시 다음 10개 중 하나만 사용하세요. 목록에 없는 이름을 새로 만들지 마세요.
조사_오용 / 경어_레벨_오류 / 어순_문제 / 시제_상_오류 / 활용형_오류 / 조수사_오류 / 어휘_선택_오류 / 생략_보충_오류 / 문형_오류 / 뉘앙스_오류

[severity 판정 기준] (임의로 판단하지 말고 이 기준을 그대로 따르세요)
- critical: 원문과 반대되거나 다른 의미로 읽히는 경우 (부정어 누락, 주체/객체 반전 등)
- warning: 문법적으로 틀렸거나 문서 전체의 어조·시제 일관성을 깨는 경우
- info: 문법은 맞지만 더 자연스러운 표현이 있는 경우 (직역투, 어휘 선택 개선 등)

[vocabulary_diff 선정 기준]
1순위: 사용자가 오역하거나 잘못 사용한 단어. 2순위(1순위로 채워지지 않을 때): 원문에서 난이도가 높은 핵심 전문용어.
${readingRule} 필요 없으면 null로 두세요. 너무 쉬운 기초 단어는 제외하고, 억지로 채우지 말고 정말 유의미한 단어만 고르세요 (없으면 빈 배열도 가능).

[strengths 선정 기준]
사용자 번역에서 특히 잘한 부분(자연스러운 표현, 원문 뉘앙스를 정확히 살린 어휘 선택 등)을 1~3개 뽑으세요. 칭찬거리를 억지로 만들어내지 말고, 정말 잘한 부분이 없으면 빈 배열로 두세요.

[기타 원칙]
- critical에 해당하지 않는 이상, 번역에는 정답이 여러 개 있을 수 있으므로 "틀렸다"고 단정하지 말고 원문 뉘앙스와의 차이를 설명하는 방식으로 코멘트하세요.
- 지적할 내용이 없으면 grammar_points를 빈 배열로 두세요. 억지로 지적을 만들어내지 마세요.
- user_expression은 사용자 번역문 안에서 실제로 찾을 수 있는 표현일 때만 채우고, 해당 요소가 통째로 누락된 경우 null로 두세요.
- suggested_translations는 "정답"이 아니라 참고용 대안 번역입니다. 사용자 번역이 이미 자연스럽다면 비워둬도 됩니다. **반드시 ${target}로만 작성하세요 — ${source}로 답하지 마세요.**
- overall_comment, difficulty.comment 등 서술형 텍스트는 한국어로 설명하되, 그 안에 인용하는 번역 예문 자체는 반드시 ${target}여야 합니다.
- ${difficultyRule}

정의된 JSON 스키마 형식으로만 응답하고, 다른 설명 텍스트를 앞뒤에 붙이지 마세요.`;
}

interface RunAnalysisParams {
  provider: Provider;
  apiKey: string;
  model?: string;
  // Claude 멀티 워크스페이스 개인 키에서만 필요. anthropic-workspace-id 헤더로 전달된다.
  workspaceId?: string;
  direction: Direction;
  sourceText: string;
  userTranslation: string;
}

function buildUserContent(
  direction: Direction,
  sourceText: string,
  userTranslation: string,
): string {
  const { source, target } = DIRECTION_LANG[direction];
  return `[${source} 원문]\n${sourceText}\n\n[사용자의 ${target} 번역]\n${userTranslation}`;
}

async function runClaudeAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  const client = new Anthropic({ apiKey: params.apiKey });

  const response = await client.messages.parse(
    {
      model: params.model || DEFAULT_MODEL.claude,
      max_tokens: 8000,
      system: buildSystemPrompt(params.direction),
      messages: [
        {
          role: "user",
          content: buildUserContent(
            params.direction,
            params.sourceText,
            params.userTranslation,
          ),
        },
      ],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(TranslationAnalysisReportSchema),
      },
    },
    params.workspaceId
      ? { headers: { "anthropic-workspace-id": params.workspaceId } }
      : undefined,
  );

  if (!response.parsed_output) {
    throw new AnalysisParseError();
  }
  return response.parsed_output;
}

function parseReport(raw: string | undefined | null): TranslationAnalysisReport {
  if (!raw) {
    throw new AnalysisParseError();
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AnalysisParseError();
  }
  const result = TranslationAnalysisReportSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AnalysisParseError();
  }
  return result.data;
}

async function runOpenAIAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const completion = await client.chat.completions.create({
    model: params.model || DEFAULT_MODEL.openai,
    messages: [
      { role: "system", content: buildSystemPrompt(params.direction) },
      {
        role: "user",
        content: buildUserContent(
          params.direction,
          params.sourceText,
          params.userTranslation,
        ),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "translation_analysis_report",
        schema: toResponseJsonSchema(),
        strict: true,
      },
    },
  });

  return parseReport(completion.choices[0]?.message?.content);
}

async function runGeminiAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  const client = new GoogleGenAI({ apiKey: params.apiKey });

  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model: params.model || DEFAULT_MODEL.gemini,
      contents: buildUserContent(
        params.direction,
        params.sourceText,
        params.userTranslation,
      ),
      config: {
        systemInstruction: buildSystemPrompt(params.direction),
        responseMimeType: "application/json",
        responseJsonSchema: toResponseJsonSchema(),
      },
    }),
  );

  return parseReport(response.text);
}

export async function runAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  switch (params.provider) {
    case "claude":
      return runClaudeAnalysis(params);
    case "openai":
      return runOpenAIAnalysis(params);
    case "gemini":
      return runGeminiAnalysis(params);
  }
}

interface TestConnectionParams {
  provider: Provider;
  apiKey: string;
  model?: string;
  workspaceId?: string;
}

// 설정 화면의 "연결 테스트" 버튼용 - 실제 분석과 같은 인증/workspace 경로를
// 타지만, 토큰을 거의 쓰지 않는 최소 요청으로 키/모델/workspace 조합이
// 유효한지만 확인한다.
export async function testConnection(params: TestConnectionParams): Promise<void> {
  if (params.provider === "claude") {
    const client = new Anthropic({ apiKey: params.apiKey });
    await client.messages.create(
      {
        model: params.model || DEFAULT_MODEL.claude,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      },
      params.workspaceId
        ? { headers: { "anthropic-workspace-id": params.workspaceId } }
        : undefined,
    );
    return;
  }

  if (params.provider === "openai") {
    const client = new OpenAI({ apiKey: params.apiKey });
    await client.chat.completions.create({
      model: params.model || DEFAULT_MODEL.openai,
      max_completion_tokens: 8,
      messages: [{ role: "user", content: "ping" }],
    });
    return;
  }

  const client = new GoogleGenAI({ apiKey: params.apiKey });
  await withGeminiRetry(() =>
    client.models.generateContent({
      model: params.model || DEFAULT_MODEL.gemini,
      contents: "ping",
      config: { maxOutputTokens: 8 },
    }),
  );
}
