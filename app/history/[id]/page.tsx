"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { TranslationAnalysisReport } from "@/lib/analysis-schema";
import {
  deleteSession,
  getSession,
  updateSessionSentence,
  type HistorySession,
  type SentenceResult,
} from "@/lib/history";
import { loadSettings } from "@/lib/settings";
import { AnalysisReportView } from "@/components/AnalysisReportView";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [session, setSession] = useState<HistorySession | null | undefined>(
    undefined,
  );
  const [index, setIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editedTranslation, setEditedTranslation] = useState("");
  const [reanalyzing, setReanalyzing] = useState(false);
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null);
  // 재분석 API 호출은 성공했지만 localStorage 저장이 실패한 경우 - 결과를
  // 잃지 않도록 여기 잠깐 들고 있다가 "다시 저장" 버튼으로 재시도한다.
  const [pendingSentence, setPendingSentence] = useState<SentenceResult | null>(
    null,
  );

  useEffect(() => {
    // 클라이언트 전용 localStorage를 마운트 후 한 번만 읽는다 (SSR/hydration 안전).
    const loaded = getSession(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loaded);
  }, [params.id]);

  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <main className="flex w-full max-w-2xl flex-col gap-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            해당 기록을 찾을 수 없습니다.
          </p>
          <Link href="/" className="text-sm underline">
            대시보드로 돌아가기
          </Link>
        </main>
      </div>
    );
  }

  const sentence = session.sentences[index];
  const total = session.sentences.length;
  const isLast = index === total - 1;

  function startEditing() {
    setEditedTranslation(sentence.userTranslation);
    setReanalyzeError(null);
    setPendingSentence(null);
    setEditing(true);
  }

  function trySaveSentence(newSentence: SentenceResult) {
    if (!session) return;
    try {
      const updated = updateSessionSentence(session.id, index, newSentence);
      if (updated) {
        setSession(updated);
      }
      setPendingSentence(null);
      setReanalyzeError(null);
      setEditing(false);
    } catch {
      // 분석 결과는 이미 메모리에 있으니 화면에서 사라지지 않는다 -
      // 저장만 다시 시도할 수 있게 남겨둔다.
      setPendingSentence(newSentence);
      setReanalyzeError(
        "결과 저장에 실패했습니다. 분석 결과는 화면에 유지되니, 다시 저장을 시도해주세요.",
      );
    }
  }

  async function submitReanalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const settings = loadSettings();
    if (!settings) {
      setReanalyzeError("API 키가 설정되지 않았습니다. 설정 화면에서 먼저 입력해주세요.");
      return;
    }

    setReanalyzing(true);
    setReanalyzeError(null);
    let newSentence: SentenceResult;
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          workspaceId: settings.workspaceId,
          direction: session.direction,
          sourceText: sentence.sourceText,
          userTranslation: editedTranslation,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        report?: TranslationAnalysisReport;
        durationMs?: number;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "AI 응답을 처리하는 중 문제가 발생했습니다. 다시 시도해주세요.");
      }
      newSentence = {
        sourceText: sentence.sourceText,
        userTranslation: editedTranslation,
        report: data.report as TranslationAnalysisReport,
        durationMs:
          typeof data.durationMs === "number" ? data.durationMs : undefined,
      };
    } catch (err) {
      setReanalyzeError(
        err instanceof Error ? err.message : "알 수 없는 오류입니다.",
      );
      setReanalyzing(false);
      return;
    }

    trySaveSentence(newSentence);
    setReanalyzing(false);
  }

  function handleNext() {
    if (!session) return;
    if (isLast) {
      // 문장이 1개뿐이면 종합 분석 페이지를 건너뛰고 바로 대시보드로.
      router.push(total > 1 ? `/history/${session.id}/summary` : "/");
    } else {
      setIndex((i) => i + 1);
      setEditing(false);
      setReanalyzeError(null);
    }
  }

  function handleDeleteSession() {
    if (!session) return;
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    deleteSession(session.id);
    router.push("/history");
  }

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
            >
              ← 대시보드로
            </Link>
            {total > 1 && (
              <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {index + 1}/{total} 문장
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="이 기록 전체 삭제"
            onClick={handleDeleteSession}
            className="shrink-0 text-sm text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
          >
            기록 삭제
          </button>
        </header>

        {total > 1 && (
          <div
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  원문
                </span>{" "}
                <span className="text-zinc-700 dark:text-zinc-300">
                  {sentence.sourceText}
                </span>
              </p>
              <p>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  내 번역
                </span>{" "}
                <span className="text-zinc-700 dark:text-zinc-300">
                  {sentence.userTranslation}
                </span>
              </p>
              {sentence.report.suggested_translations[0] && (
                <p>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    AI 번역(기준)
                  </span>{" "}
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {sentence.report.suggested_translations[0]}
                  </span>
                </p>
              )}
            </div>
            {sentence.durationMs !== undefined && (
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                {(sentence.durationMs / 1000).toFixed(1)}초
              </span>
            )}
          </div>

          <AnalysisReportView
            report={sentence.report}
            userTranslation={sentence.userTranslation}
          />
        </div>

        {editing ? (
          <form
            onSubmit={submitReanalyze}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                번역 수정 (원문은 고정)
              </span>
              <textarea
                value={editedTranslation}
                onChange={(e) => setEditedTranslation(e.target.value)}
                required
                disabled={reanalyzing}
                rows={3}
                aria-label="수정한 한국어 번역"
                className="rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </label>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={reanalyzing}
                aria-label="수정한 번역 재분석"
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {reanalyzing ? "재분석 중..." : "재분석"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={reanalyzing}
                className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-white"
              >
                취소
              </button>
            </div>
            {reanalyzeError && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              >
                <p>{reanalyzeError}</p>
                {pendingSentence && (
                  <button
                    type="button"
                    onClick={() => trySaveSentence(pendingSentence)}
                    className="self-start rounded-full border border-red-400 px-4 py-1.5 text-xs font-medium hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/50"
                  >
                    다시 저장 시도
                  </button>
                )}
              </div>
            )}
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={startEditing}
              aria-label="번역 수정 후 재분석"
              className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              번역 수정 후 재분석
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label={
                isLast
                  ? total > 1
                    ? "저장하고 종합 분석 보기"
                    : "완료하고 대시보드로 이동"
                  : "저장하고 다음 문장으로"
              }
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {isLast ? (total > 1 ? "저장하고 종합 분석 보기" : "완료") : "저장하고 다음"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
