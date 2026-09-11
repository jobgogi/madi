import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { resolvePromptTemplate } from "@/lib/providers/analyze";
import { parseRateLimitedRequest } from "@/lib/api-request";
import { createClient } from "@/lib/supabase/server";

const RequestSchema = z.object({
  content: z.string(),
  nativeLanguage: z.enum(["ko", "ja"]),
});

// vocabulary_diff.reading을 direction별 고정 텍스트로 치환하려던 마이그레이션이
// 실제 DB 문구와 한 글자 달라 조용히 실패했던 사고(2026-09-11) 재발 방지용 -
// LLM을 호출하지 않고 resolvePromptTemplate()만 돌려서, 저장/활성화 전에
// {{explanationLang}} 등 플레이스홀더가 실제로 치환되는지 관리자가 눈으로
// 바로 확인할 수 있게 한다. LLM 호출이 없어 PROMPT_TEST_* 키가 없어도 동작.
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

  const result = await parseRateLimitedRequest(req, "prompt-resolve", RequestSchema);
  if ("errorResponse" in result) return result.errorResponse;

  const resolved = resolvePromptTemplate(result.data.content, result.data.nativeLanguage);
  const unresolvedPlaceholders = [...new Set(resolved.match(/\{\{[a-zA-Z]+\}\}/g) ?? [])];
  return NextResponse.json({ resolved, unresolvedPlaceholders });
}
