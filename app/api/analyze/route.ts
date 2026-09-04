import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { DIRECTIONS } from "@/lib/analysis-schema";
import { runAnalysis } from "@/lib/providers/analyze";
import { describeProviderError } from "@/lib/providers/errors";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

const RequestSchema = z.object({
  provider: z.enum(["claude", "openai", "gemini"]),
  apiKey: z.string().min(1, "API 키가 설정되지 않았습니다. 설정 화면에서 먼저 입력해주세요."),
  model: z.string().optional(),
  workspaceId: z.string().optional(),
  direction: z.enum(DIRECTIONS),
  sourceText: z.string().min(1, "원문을 입력해주세요."),
  userTranslation: z.string().min(1, "번역을 입력해주세요."),
});

export async function POST(req: NextRequest) {
  if (isRateLimited(`analyze:${getClientIp(req)}`)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const parsedBody = RequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const startedAt = Date.now();
  try {
    const report = await runAnalysis(parsedBody.data);
    return NextResponse.json({ report, durationMs: Date.now() - startedAt });
  } catch (error) {
    const { status, message } = describeProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
