import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod/v4";
import { getClientIp, isRateLimited } from "./rate-limit";

// app/api/* route handler들이 반복하던 "rate limit 체크 -> JSON 파싱 -> zod 검증 ->
// 실패 시 표준 에러 응답" 앞단 처리를 공유. 성공하면 타입까지 좁혀진 data를 반환.
export async function parseRateLimitedRequest<T>(
  req: NextRequest,
  rateLimitKeyPrefix: string,
  schema: z.ZodType<T>,
  maxRequests?: number,
): Promise<{ data: T } | { errorResponse: NextResponse }> {
  if (isRateLimited(`${rateLimitKeyPrefix}:${getClientIp(req)}`, maxRequests)) {
    return {
      errorResponse: NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 },
      ),
    };
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { errorResponse: NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 }) };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      errorResponse: NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." },
        { status: 400 },
      ),
    };
  }

  return { data: parsed.data };
}
