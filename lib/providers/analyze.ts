import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import OpenAI from "openai";
import { GoogleGenAI, ApiError as GeminiApiError } from "@google/genai";
import { z } from "zod/v4";
import {
  BatchTranslationAnalysisReportSchema,
  DIRECTION_LANG,
  type Direction,
  type TranslationAnalysisReport,
} from "@/lib/analysis-schema";
import type { NativeLanguage } from "@/lib/native-language";
import { LOCKED_PROMPT_RULES } from "@/lib/prompt-rules";

export { LOCKED_PROMPT_RULES };

const EXPLANATION_LANG_NAME: Record<NativeLanguage, string> = {
  ko: "한국어",
  ja: "일본어",
};

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
  const { $schema, ...schema } = z.toJSONSchema(BatchTranslationAnalysisReportSchema) as Record<
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

// vocabulary_diff[].reading 안내 - 사용자 모국어에 따라 어느 표기(가타카나/
// 후리가나)로 읽는 법을 병기할지 정한다. direction을 수동으로 뒤집어 원문
// 언어가 자기 모국어와 같아지는 경우(예: 모국어 한국어인 사용자가 ko_to_ja
// 선택)는 흔치 않은 사용 패턴으로 보고 단순화를 위해 다루지 않는다 - 항상
// 모국어 기준으로만 판단.
function buildReadingGuidance(nativeLanguage: NativeLanguage): string {
  if (nativeLanguage === "ja") {
    return "각 단어에는 reading을 병기하세요. 한자어라도 대응하는 일본어 한자어의 음독으로 바꾸지 말고, 한글 그대로의 한국어 발음을 가타카나로 최대한 가깝게 표기하세요(사용자가 한글 읽는 법 자체를 익히는 것이 목적입니다). 필요 없으면 null로 두세요.";
  }
  return "각 단어에는 reading(한자 요미가나, 히라가나 표기)을 병기하세요. 필요 없으면 null로 두세요.";
}

// 시스템 프롬프트 본문(편집 가능 부분)은 prompt_templates DB 테이블(방향별 활성
// 버전)이 유일 소스. 방향에 따라서만 달라지는 고정 표현(언어명 등)은 이미
// 방향별 행에 고정 텍스트로 들어있다. 사용자 모국어에 따라 달라지는 부분은
// {{explanationLang}}과 {{readingGuidance}} 플레이스홀더로 남겨뒀으므로 요청
// 시점에 치환한다. 그 뒤에 LOCKED_PROMPT_RULES를 항상 덧붙여서 관리자 입력
// 내용과 무관하게 구조적 제약이 보장되게 한다. 관리자 화면
// (app/admin/prompt-templates)과 API 라우트(app/api/analyze,
// app/api/admin/prompt-preview) 양쪽에서 호출.
export function resolvePromptTemplate(content: string, nativeLanguage: NativeLanguage): string {

  console.log(nativeLanguage);

  const resolved = content
    .split("{{explanationLang}}")
    .join(EXPLANATION_LANG_NAME[nativeLanguage])
    .split("{{readingGuidance}}")
    .join(buildReadingGuidance(nativeLanguage));
  return `${resolved}\n\n${LOCKED_PROMPT_RULES}`;
}

interface SentencePair {
  sourceText: string;
  userTranslation: string;
}

interface RunAnalysisParams {
  provider: Provider;
  apiKey: string;
  model?: string;
  // Claude 멀티 워크스페이스 개인 키에서만 필요. anthropic-workspace-id 헤더로 전달된다.
  workspaceId?: string;
  direction: Direction;
  // 리포트 설명 텍스트(overall_comment 등)를 어느 언어로 쓸지 - 번역
  // 방향(direction)과는 독립적이다 (사용자가 방향을 수동으로 바꿔도
  // 설명은 항상 본인 모국어여야 하므로).
  nativeLanguage: NativeLanguage;
  // prompt_templates(direction별 활성 버전)의 content 원문. {{explanationLang}}
  // 플레이스홀더는 이 함수 내부에서 resolvePromptTemplate()로 치환한다.
  // 호출자(app/api/analyze, app/api/admin/prompt-preview)가 DB/초안에서 가져와 전달.
  systemPromptTemplate: string;
  sentences: SentencePair[];
}

// 시스템 프롬프트에서 이미 언어 규칙을 명시해도, 문장이 여러 개 배치로
// 들어가면 뒤쪽 문장으로 갈수록 suggested_translations/설명 텍스트가
// 엉뚱한 언어로 새는 경우가 실제로 관측됐다 - 문장 블록마다 바로 옆에서
// 다시 한 번 못박아서 항목별로 잊혀지지 않게 한다.
function buildUserContent(
  direction: Direction,
  nativeLanguage: NativeLanguage,
  sentences: SentencePair[],
): string {
  const { source, target } = DIRECTION_LANG[direction];
  const explanationLang = EXPLANATION_LANG_NAME[nativeLanguage];
  return sentences
    .map(
      ({ sourceText, userTranslation }, i) =>
        `[${i + 1}번째 문장]\n[${source} 원문]\n${sourceText}\n\n[사용자의 ${target} 번역]\n${userTranslation}\n(이 문장의 suggested_translations는 반드시 ${target}로, comment/meaning 등 설명 텍스트는 반드시 ${explanationLang}로 작성)`,
    )
    .join("\n\n");
}

// 배치 응답이 입력 문장 개수와 정확히 일치하는지 확인 - LLM이 개수를
// 틀리면 이후 입력과 report를 순서로 매칭하는 로직 전체가 깨지므로 여기서
// 바로 걸러낸다.
function assertReportCount(
  reports: TranslationAnalysisReport[],
  expected: number,
): TranslationAnalysisReport[] {
  if (reports.length !== expected) {
    throw new AnalysisParseError();
  }
  return reports;
}

async function runClaudeAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport[]> {
  const client = new Anthropic({ apiKey: params.apiKey });

  const response = await client.messages.parse(
    {
      model: params.model || DEFAULT_MODEL.claude,
      max_tokens: 8000,
      system: resolvePromptTemplate(params.systemPromptTemplate, params.nativeLanguage),
      messages: [
        {
          role: "user",
          content: buildUserContent(params.direction, params.nativeLanguage, params.sentences),
        },
      ],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(BatchTranslationAnalysisReportSchema),
      },
    },
    params.workspaceId
      ? { headers: { "anthropic-workspace-id": params.workspaceId } }
      : undefined,
  );

  if (!response.parsed_output) {
    throw new AnalysisParseError();
  }
  return assertReportCount(response.parsed_output.reports, params.sentences.length);
}

function parseReport(raw: string | undefined | null): TranslationAnalysisReport[] {
  if (!raw) {
    throw new AnalysisParseError();
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AnalysisParseError();
  }
  const result = BatchTranslationAnalysisReportSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AnalysisParseError();
  }
  return result.data.reports;
}

async function runOpenAIAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport[]> {
  const client = new OpenAI({ apiKey: params.apiKey });

  const completion = await client.chat.completions.create({
    model: params.model || DEFAULT_MODEL.openai,
    messages: [
      { role: "system", content: resolvePromptTemplate(params.systemPromptTemplate, params.nativeLanguage) },
      {
        role: "user",
        content: buildUserContent(params.direction, params.nativeLanguage, params.sentences),
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

  return assertReportCount(
    parseReport(completion.choices[0]?.message?.content),
    params.sentences.length,
  );
}

async function runGeminiAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport[]> {
  const client = new GoogleGenAI({ apiKey: params.apiKey });

  console.log(params, params.systemPromptTemplate, params.nativeLanguage);

  const response = await withGeminiRetry(() =>
    client.models.generateContent({
      model: params.model || DEFAULT_MODEL.gemini,
      contents: buildUserContent(params.direction, params.nativeLanguage, params.sentences),
      config: {
        systemInstruction: resolvePromptTemplate(params.systemPromptTemplate, params.nativeLanguage),
        responseMimeType: "application/json",
        responseJsonSchema: toResponseJsonSchema(),
      },
    }),
  );

  return assertReportCount(parseReport(response.text), params.sentences.length);
}

export async function runAnalysis(
  params: RunAnalysisParams,
): Promise<TranslationAnalysisReport[]> {
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
