"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TranslationAnalysisReport } from "@/lib/analysis-schema";
import { loadSettings, type Settings } from "@/lib/settings";
import { addSession, getAverageDurationMs, type SentenceResult } from "@/lib/history";
import { pairSentences } from "@/lib/sentence-split";

class AnalyzeRequestError extends Error {
  kind: "network" | "api";
  constructor(kind: "network" | "api", message: string) {
    super(message);
    this.name = "AnalyzeRequestError";
    this.kind = kind;
  }
}

async function analyzeOne(
  settings: Settings,
  sourceText: string,
  userTranslation: string,
): Promise<SentenceResult> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        workspaceId: settings.workspaceId,
        sourceText,
        userTranslation,
      }),
    });
  } catch {
    // fetch 자체가 던지는 건 서버 응답이 아니라 네트워크 계층 실패
    // (연결 끊김, DNS 실패 등)인 경우가 대부분이다.
    throw new AnalyzeRequestError("network", "네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인해주세요.");
  }

  const data = (await res.json()) as {
    error?: string;
    report?: TranslationAnalysisReport;
    durationMs?: number;
  };
  if (!res.ok) {
    throw new AnalyzeRequestError("api", data.error ?? "분석에 실패했습니다.");
  }

  return {
    sourceText,
    userTranslation,
    report: data.report as TranslationAnalysisReport,
    durationMs: typeof data.durationMs === "number" ? data.durationMs : undefined,
  };
}

export default function NewSessionPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null | undefined>(
    undefined,
  );
  const [sourceText, setSourceText] = useState("");
  const [userTranslation, setUserTranslation] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<AnalyzeRequestError | null>(null);
  // 분석 자체는 끝났지만 localStorage 저장이 실패한 경우 - 결과를 잃지
  // 않도록 여기 잠깐 들고 있다가 "다시 저장" 버튼으로 재시도한다.
  const [pendingResults, setPendingResults] = useState<SentenceResult[] | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    // One-time read of a client-only source (localStorage) on mount, to avoid
    // an SSR/hydration mismatch - not a case the "set state in effect" rule
    // is meant to catch (there's no external subscription to model here).
    const existing = loadSettings();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(existing);
    if (!existing) {
      router.replace("/settings");
    }
  }, [router]);

  const estimatedMs = useMemo(
    () => (settings ? getAverageDurationMs(settings.provider) : null),
    [settings],
  );

  const sentenceCount = useMemo(
    () => pairSentences(sourceText, userTranslation).length,
    [sourceText, userTranslation],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    const pairs = pairSentences(sourceText, userTranslation);

    setLoading(true);
    setError(null);
    setProgress({ done: 0, total: pairs.length });

    const results: SentenceResult[] = [];
    try {
      for (const pair of pairs) {
        const result = await analyzeOne(settings, pair.source, pair.translation);
        results.push(result);
        setProgress({ done: results.length, total: pairs.length });
      }
    } catch (err) {
      setError(
        err instanceof AnalyzeRequestError
          ? err
          : new AnalyzeRequestError("api", "알 수 없는 오류입니다."),
      );
      setLoading(false);
      setProgress(null);
      return;
    }

    setLoading(false);
    setProgress(null);
    trySave(settings.provider, results);
  }

  function trySave(provider: Settings["provider"], results: SentenceResult[]) {
    try {
      const session = addSession(provider, results);
      setPendingResults(null);
      setSaveError(null);
      router.push(`/history/${session.id}`);
    } catch {
      // 분석 결과는 이미 메모리에 있으니 화면에서 사라지지 않는다 -
      // 저장만 다시 시도할 수 있게 남겨둔다.
      setPendingResults(results);
      setSaveError(
        "결과 저장에 실패했습니다. 분석 결과는 화면에 유지되니, 다시 저장을 시도해주세요.",
      );
    }
  }

  // 설정 확인 전이거나, 확인 후 /settings로 리다이렉트하는 중.
  if (settings === undefined || settings === null) {
    return null;
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-8">
        <header>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            ← 대시보드로
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            새 학습
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            여러 문장을 한 번에 입력해도 문장 단위로 자동 분석됩니다. 원문과
            번역의 문장 수가 같아야 문장별로 짝지어집니다.
            {sentenceCount > 1 && ` 긴 글은 문장 수만큼(${sentenceCount}회) API 요청이 발생합니다.`}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              일본어 원문
            </span>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              required
              disabled={loading}
              rows={4}
              aria-label="일본어 원문 입력"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="彼はその話を聞いて、少し驚いたようだった。"
            />
            <span className="self-end text-xs text-zinc-400 dark:text-zinc-500">
              {sourceText.length}자
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              내 한국어 번역
            </span>
            <textarea
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              required
              disabled={loading}
              rows={4}
              aria-label="한국어 번역 입력"
              className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="그는 그 이야기를 듣고 조금 놀란 것 같았다."
            />
            <span className="self-end text-xs text-zinc-400 dark:text-zinc-500">
              {userTranslation.length}자
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            aria-label="분석 시작"
            className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            분석 시작
          </button>

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
            >
              {progress && progress.total > 1
                ? `${progress.done}/${progress.total} 문장 분석 중...`
                : "분석 중..."}
              {estimatedMs !== null && (
                <span className="ml-1 text-zinc-400 dark:text-zinc-500">
                  (예상 약 {Math.round(estimatedMs / 1000)}초
                  {progress && progress.total > 1 ? " / 문장" : ""})
                </span>
              )}
            </div>
          )}
        </form>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
          >
            {error.kind === "network" && "🔌 "}
            {error.message}
          </div>
        )}

        {saveError && pendingResults && (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          >
            <p>{saveError}</p>
            <button
              type="button"
              onClick={() => trySave(settings.provider, pendingResults)}
              className="self-start rounded-full border border-amber-400 px-4 py-1.5 text-xs font-medium hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
            >
              다시 저장 시도
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
