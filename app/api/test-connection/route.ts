import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { testConnection } from "@/lib/providers/analyze";
import { describeProviderError } from "@/lib/providers/errors";
import { parseRateLimitedRequest } from "@/lib/api-request";

const RequestSchema = z.object({
  provider: z.enum(["claude", "openai", "gemini"]),
  apiKey: z.string().min(1, "API 키가 설정되지 않았습니다. 설정 화면에서 먼저 입력해주세요."),
  model: z.string().optional(),
  workspaceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const result = await parseRateLimitedRequest(req, "test-connection", RequestSchema, 5);
  if ("errorResponse" in result) return result.errorResponse;

  try {
    await testConnection(result.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, message } = describeProviderError(error);
    return NextResponse.json({ error: message }, { status });
  }
}
