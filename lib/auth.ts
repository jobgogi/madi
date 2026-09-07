import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// signin 화면의 Google OAuth 트리거 + 로딩/에러 상태 - 다른 로그인
// 진입점(재로그인 유도 등)에서도 재사용할 수 있도록 컴포넌트 밖으로 분리.
export function useGoogleSignin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
