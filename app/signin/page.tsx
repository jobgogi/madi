"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SigninPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
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

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">마디</h1>
          <p className="mt-1 text-sm text-zinc-500">
            AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          aria-label="Google 계정으로 로그인"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          <svg aria-hidden viewBox="0 0 48 48" className="h-4 w-4">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.4 10.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6c-2.1 1.5-4.7 2.5-7.7 2.5-5.2 0-9.6-3.3-11.2-7.9l-6.6 5.1C9.8 39.6 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.2 5.6l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.3-.1-2.5-.4-3.5z"
            />
          </svg>
          {loading ? "로그인 중..." : "Google로 로그인"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
