import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
import { z } from "zod/v4";
import {
  TranslationAnalysisReportSchema,
  type TranslationAnalysisReport,
} from "@/lib/analysis-schema";

export type Provider = "claude" | "openai";

const DEFAULT_MODEL: Record<Provider, string> = {
  claude: "claude-opus-5",
  // OpenAI 모델 이름은 자주 바뀌므로, 설정 화면에서 직접 입력한 값을 우선
  // 사용한다. 이 기본값은 사용 시점에 최신 모델명인지 확인 후 필요하면 설정에서
  // 바꿔줄 것.
  openai: "gpt-5",
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

export class AnalysisParseError extends Error {
  constructor(message = "분석 결과를 파싱하지 못했습니다.") {
    super(message);
    this.name = "AnalysisParseError";
  }
}

const SYSTEM_PROMPT = `당신은 일본어->한국어 번역 학습을 돕는 코치입니다.
사용자가 제시한 일본어 원문과 그 사람이 직접 작성한 한국어 번역을 비교 분석하세요.

[최우선 규칙: 의미 왜곡 우선 감지]
다른 무엇보다 먼저, 사용자 번역이 원문의 의미를 반대로 바꾸거나(부정어 누락/추가 등) 핵심 사실 관계를 왜곡하는 부분이 있는지 검사하세요. 이런 오류를 발견하면 severity를 반드시 "critical"로 표시하고, grammar_points 배열의 가장 첫 번째 항목으로 배치하세요. 문법이 매끄러운 것과 의미가 정확한 것은 다른 문제이며, 문장이 아무리 자연스럽게 읽혀도 의미 왜곡은 반드시 지적해야 합니다.

[카테고리 규칙]
grammar_points의 category는 반드시 다음 10개 중 하나만 사용하세요. 목록에 없는 이름을 새로 만들지 마세요.
조사_오용 / 경어_레벨_오류 / 어순_문제 / 시제_상_오류 / 활용형_오류 / 조수사_오류 / 어휘_선택_오류 / 생략_보충_오류 / 문형_오류 / 뉘앙스_오류

[severity 판정 기준] (임의로 판단하지 말고 이 기준을 그대로 따르세요)
- critical: 원문과 반대되거나 다른 의미로 읽히는 경우 (부정어 누락, 주체/객체 반전 등)
- warning: 문법적으로 틀렸거나 문서 전체의 어조·시제 일관성을 깨는 경우
- info: 문법은 맞지만 더 자연스러운 표현이 있는 경우 (직역투, 어휘 선택 개선 등)

[vocabulary_diff 선정 기준]
1순위: 사용자가 오역하거나 잘못 사용한 단어. 2순위(1순위로 채워지지 않을 때): 원문에서 난이도가 높은 핵심 전문용어.
각 단어에는 reading(한자 읽기/요미가나)을 병기하세요. 필요 없으면 null로 두세요. 너무 쉬운 기초 단어는 제외하고, 억지로 채우지 말고 정말 유의미한 단어만 고르세요 (없으면 빈 배열도 가능).

[기타 원칙]
- critical에 해당하지 않는 이상, 번역에는 정답이 여러 개 있을 수 있으므로 "틀렸다"고 단정하지 말고 원문 뉘앙스와의 차이를 설명하는 방식으로 코멘트하세요.
- 지적할 내용이 없으면 grammar_points를 빈 배열로 두세요. 억지로 지적을 만들어내지 마세요.
- user_expression은 사용자 번역문 안에서 실제로 찾을 수 있는 표현일 때만 채우고, 해당 요소가 통째로 누락된 경우 null로 두세요.
- suggested_translations는 "정답"이 아니라 참고용 대안 번역입니다. 사용자 번역이 이미 자연스럽다면 비워둬도 됩니다.
- difficulty.level은 원문 전체의 JLPT 기준 대략적인 난이도(N5~N1)를 판단하고, comment에 그 이유를 간단히 설명하세요.

정의된 JSON 스키마 형식으로만 응답하고, 다른 설명 텍스트를 앞뒤에 붙이지 마세요.`;

interface RunAnalysisParams {
  provider: Provider;
  apiKey: string;
  model?: string;
  // Claude 멀티 워크스페이스 개인 키에서만 필요. anthropic-workspace-id 헤더로 전달된다.
  workspaceId?: string;
  sourceText: string;
  userTranslation: string;
}

function buildUserContent(sourceText: string, userTranslation: string): string {
  return `[일본어 원문]\n${sourceText}\n\n[사용자의 한국어 번역]\n${userTranslation}`;
}

async function runClaudeAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  const client = new Anthropic({ apiKey: params.apiKey });

  const response = await client.messages.parse(
    {
      model: params.model || DEFAULT_MODEL.claude,
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserContent(params.sourceText, params.userTranslation),
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
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserContent(params.sourceText, params.userTranslation),
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

export async function runAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport> {
  switch (params.provider) {
    case "claude":
      return runClaudeAnalysis(params);
    case "openai":
      return runOpenAIAnalysis(params);
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

  const client = new OpenAI({ apiKey: params.apiKey });
  await client.chat.completions.create({
    model: params.model || DEFAULT_MODEL.openai,
    max_completion_tokens: 8,
    messages: [{ role: "user", content: "ping" }],
  });
}
