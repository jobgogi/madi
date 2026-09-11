import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { DIRECTIONS } from "@/lib/analysis-schema";
import { runAnalysis, type Provider } from "@/lib/providers/analyze";
import { describeProviderError } from "@/lib/providers/errors";
import { parseRateLimitedRequest } from "@/lib/api-request";
import { createClient } from "@/lib/supabase/server";
import { isProvider } from "@/lib/settings";

const RequestSchema = z.object({
  direction: z.enum(DIRECTIONS),
  nativeLanguage: z.enum(["ko", "ja"]),
  // 저장/활성화 전 초안 프롬프트 내용 - prompt_templates DB를 거치지 않고 그대로 사용한다.
  promptContent: z.string().min(1, "프롬프트 내용을 입력해주세요."),
  sentences: z
    .array(
      z.object({
        sourceText: z.string().min(1, "원문을 입력해주세요."),
        userTranslation: z.string().min(1, "번역을 입력해주세요."),
      }),
    )
    .min(1, "테스트할 문장이 없습니다."),
});

// 일반 사용자 분석 흐름(app/api/analyze)은 BYOK(브라우저 localStorage 키)이지만,
// 이 테스트 전용 엔드포인트는 관리자 개인 키를 요청마다 주고받지 않도록 서버 환경
// 변수(PROMPT_TEST_*)를 쓴다 - .env에 등록.
function loadTestCredentials(): { provider: Provider; apiKey: string; model?: string; workspaceId?: string } | null {
  const provider = process.env.PROMPT_TEST_PROVIDER;
  const apiKey = process.env.PROMPT_TEST_API_KEY;
  if (!provider || !apiKey || !isProvider(provider)) return null;
  return {
    provider,
    apiKey,
    model: process.env.PROMPT_TEST_MODEL || undefined,
    workspaceId: process.env.PROMPT_TEST_WORKSPACE_ID || undefined,
  };
}

// 관리자가 프롬프트 템플릿을 저장/활성화하기 전에, 초안 내용으로 실제 LLM을
// 호출해 결과를 미리 확인하는 전용 엔드포인트. app/api/analyze와 달리
// prompt_templates DB를 조회하지 않고 요청에 담긴 promptContent를 그대로 쓴다 -
// 그래서 일반 사용자에게 노출하면 안 되고 admin만 호출 가능해야 한다.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 사용할 수 있습니다." }, { status: 403 });
  }

  const credentials = loadTestCredentials();
  if (!credentials) {
    return NextResponse.json(
      { error: "서버에 PROMPT_TEST_PROVIDER/PROMPT_TEST_API_KEY가 설정되어 있지 않습니다. .env를 확인해주세요." },
      { status: 500 },
    );
  }

  const result = await parseRateLimitedRequest(req, "prompt-preview", RequestSchema);
  if ("errorResponse" in result) return result.errorResponse;

  const { promptContent, ...rest } = result.data;
  const startedAt = Date.now();
  try {
    const reports = await runAnalysis({ ...rest, ...credentials, systemPromptTemplate: promptContent });
    return NextResponse.json({ reports, durationMs: Date.now() - startedAt });
  } catch (error) {
    const { status, message } = describeProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
