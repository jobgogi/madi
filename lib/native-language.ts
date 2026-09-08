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
