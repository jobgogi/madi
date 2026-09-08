"use client";

import { useGoogleSignin } from "@/lib/hooks/useGoogleSignin";

export default function SigninPage() {
  const { signIn, loading, error } = useGoogleSignin();

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
          onClick={signIn}
          disabled={loading}
          aria-label="Google 계정으로 로그인"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          <img src="/google-icon.svg" alt="" className="h-4 w-4" />
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
