import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // profiles 행은 보통 auth.users insert 트리거로 생성되지만, 트리거가
      // 생기기 전부터 있던 계정은 행이 없을 수 있다 - 여기서 없으면 채워
      // 넣어야 이후 native_language 저장(UPDATE)이 대상 행을 찾는다.
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: data.user.id }, { onConflict: "id", ignoreDuplicates: true });
      if (profileError) console.error("profiles upsert failed", profileError);

      // 로그인 기록 실패는 로그인 자체를 막으면 안 되므로 best-effort로만 처리.
      const { error: loginHistoryError } = await supabase
        .from("login_history")
        .insert({ user_id: data.user.id });
      if (loginHistoryError) console.error("login_history insert failed", loginHistoryError);

      return NextResponse.redirect(origin);
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`);
}
