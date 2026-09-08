"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useGoogleSignin } from "@/lib/hooks/useGoogleSignin";
import { useLocale } from "@/lib/hooks/useLocale";
import { signin } from "@/lib/i18n/signin";

export default function SigninPage() {
  return (
    <Suspense>
      <SigninForm />
    </Suspense>
  );
}

function SigninForm() {
  const { signIn, loading, error } = useGoogleSignin();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = signin[locale];
  const callbackError = searchParams.get("error") === "auth_callback_failed" ? t.callbackError : null;
  const displayError = error ?? callbackError;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 rounded-lg border border-zinc-200 bg-white p-8 text-center">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">마디</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.subtitle}</p>
        </div>

        <button
          type="button"
          onClick={signIn}
          disabled={loading}
          aria-label={t.ctaAriaLabel}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
        >
          <img src="/google-icon.svg" alt="" className="h-4 w-4" />
          {loading ? t.loading : t.ctaLabel}
        </button>

        {displayError && (
          <p role="alert" className="text-sm text-red-600">
            {displayError}
          </p>
        )}
      </main>
    </div>
  );
}
