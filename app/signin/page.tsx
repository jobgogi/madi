"use client";

import { createClient } from "@/lib/supabase/client";

export default function SigninPage() {
  const supabase = createClient();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("로그인 실패:", error.message);
    }
  };

  return (
    <button onClick={handleLogin}>
      Google로 로그인
    </button>
  );
}