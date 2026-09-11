import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { DIRECTIONS, type Direction } from "@/lib/analysis-schema";
import { runAnalysis } from "@/lib/providers/analyze";
import { describeProviderError } from "@/lib/providers/errors";
import { parseRateLimitedRequest } from "@/lib/api-request";
import { createClient } from "@/lib/supabase/server";

// prompt_templates(관리자 화면에서 관리)의 방향별 활성 버전을 가져온다 - 이 값이
// 실제 분석에 쓰이는 시스템 프롬프트의 유일 소스. 배경: .claude/requirements/admin-requirement.md
// id도 함께 돌려줘서 호출부가 reports.prompt_template_id에 기록할 수 있게 한다 -
// 어떤 리포트가 어떤 프롬프트 버전으로 만들어졌는지 추적(관리자 평가 집계용).
async function getActivePromptTemplate(direction: Direction): Promise<{ id: string; content: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select("id, content")
    .eq("direction", direction)
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

const RequestSchema = z.object({
  provider: z.enum(["claude", "openai", "gemini"]),
  apiKey: z.string().min(1, "API 키가 설정되지 않았습니다. 설정 화면에서 먼저 입력해주세요."),
  model: z.string().optional(),
  workspaceId: z.string().optional(),
  direction: z.enum(DIRECTIONS),
  nativeLanguage: z.enum(["ko", "ja"]),
  sentences: z
    .array(
      z.object({
        sourceText: z.string().min(1, "원문을 입력해주세요."),
        userTranslation: z.string().min(1, "번역을 입력해주세요."),
      }),
    )
    .min(1, "분석할 문장이 없습니다."),
});

export async function POST(req: NextRequest) {
  const result = await parseRateLimitedRequest(req, "analyze", RequestSchema);
  if ("errorResponse" in result) return result.errorResponse;

  const activeTemplate = await getActivePromptTemplate(result.data.direction);
  if (!activeTemplate) {
    return NextResponse.json(
      { error: "이 방향에 활성화된 프롬프트 템플릿이 없습니다. 관리자에게 문의해주세요." },
      { status: 500 },
    );
  }

  const startedAt = Date.now();
  try {
    const reports = await runAnalysis({ ...result.data, systemPromptTemplate: activeTemplate.content });
    return NextResponse.json({
      reports,
      durationMs: Date.now() - startedAt,
      promptTemplateId: activeTemplate.id,
    });
  } catch (error) {
    const { status, message } = describeProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
