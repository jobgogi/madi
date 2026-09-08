import type { Direction } from "@/lib/analysis-schema";
import { createClient } from "@/lib/supabase/client";

export type NativeLanguage = "ko" | "ja";

function isNativeLanguage(value: unknown): value is NativeLanguage {
  return value === "ko" || value === "ja";
}

export async function loadNativeLanguage(): Promise<NativeLanguage | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("native_language")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("loadNativeLanguage failed", error);
    return null;
  }
  return isNativeLanguage(data.native_language) ? data.native_language : null;
}

export async function saveNativeLanguage(lang: NativeLanguage): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("profiles")
    .update({ native_language: lang })
    .eq("id", user.id);

  if (error) console.error("saveNativeLanguage failed", error);
}

// 모국어에 따른 기본 학습 방향 - 한국어 화자는 일본어를 한국어로,
// 일본어 화자는 한국어를 일본어로 번역하며 학습한다.
export function directionForLanguage(lang: NativeLanguage): Direction {
  return lang === "ko" ? "ja_to_ko" : "ko_to_ja";
}

// DB에 저장된 native_language가 아직 없을 때(로딩 중이거나 온보딩 전)
// 무조건 한국어로 보여주는 대신 쓰는 최선 추정치 - 브라우저 언어 설정
// 기준. SSR에는 navigator가 없으므로 클라이언트 마운트 후에만 의미있다.
export function detectBrowserLanguage(): NativeLanguage {
  if (typeof navigator === "undefined") return "ko";
  return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "ko";
}

// 로그인 전(랜딩/로그인 화면)은 native_language도 없고 클라이언트
// 컴포넌트가 아니라 navigator도 못 쓴다 - Server Component에서 요청의
// Accept-Language 헤더로 같은 추정을 한다.
export function detectAcceptLanguage(acceptLanguage: string | null): NativeLanguage {
  if (!acceptLanguage) return "ko";
  const first = acceptLanguage.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("ja") ? "ja" : "ko";
}
