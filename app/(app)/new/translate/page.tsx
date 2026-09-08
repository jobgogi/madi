"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { z } from "zod/v4";
import { TranslationAnalysisReportSchema } from "@/lib/analysis-schema";
import { addSession } from "@/lib/history";
import { loadSettings } from "@/lib/settings";
import { useFlow } from "../flow-context";

const AnalyzeApiResponseSchema = z.object({
  reports: z.array(TranslationAnalysisReportSchema),
  durationMs: z.number(),
});

function autoResize(el: HTMLTextAreaElement | null): void {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

export default function TranslatePage() {
  const router = useRouter();
  const { paragraphs, groups, setGroups, direction } = useFlow();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paragraphs.length === 0) router.replace("/new");
  }, [paragraphs, router]);

  if (paragraphs.length === 0) return null;

  const totalSentences = groups.reduce((sum, g) => sum + g.sentences.length, 0);
  const doneSentences = groups.reduce(
    (sum, g) => sum + g.sentences.filter((s) => s.translation.trim().length > 0).length,
    0,
  );
  const allDone = totalSentences > 0 && doneSentences === totalSentences;

  function updateTranslation(groupIndex: number, sentenceIndex: number, value: string) {
    setGroups((prev) =>
      prev.map((g, gi) =>
        gi !== groupIndex
          ? g
          : {
              ...g,
              sentences: g.sentences.map((s, si) => (si === sentenceIndex ? { ...s, translation: value } : s)),
            },
      ),
    );
  }

  async function handleAnalyze() {
    setError(null);
    const settings = loadSettings();
    if (!settings) {
      setError("설정 화면에서 API 키를 먼저 입력해주세요.");
      return;
    }

    const sentences = groups.flatMap((g) => g.sentences).map((s) => ({
      sourceText: s.source,
      userTranslation: s.translation,
    }));

    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: settings.provider,
          apiKey: settings.apiKey,
          model: settings.model,
          workspaceId: settings.workspaceId,
          direction,
          sentences,
        }),
      });

      const body: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : "분석 중 오류가 발생했습니다.";
        setError(message);
        return;
      }

      const parsed = AnalyzeApiResponseSchema.safeParse(body);
      if (!parsed.success) {
        setError("분석 결과를 처리하지 못했습니다.");
        return;
      }

      const { reports, durationMs } = parsed.data;
      const perSentenceDuration = Math.round(durationMs / sentences.length);
      const session = await addSession(
        settings.provider,
        direction,
        sentences.map((s, i) => ({ ...s, report: reports[i], durationMs: perSentenceDuration })),
      );
      if (!session) {
        setError("기록 저장에 실패했습니다. 로그인 상태를 확인해주세요.");
        return;
      }

      router.push(`/history/${session.id}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <header>
        <h1 className="text-xl font-semibold text-zinc-900">새 학습 — 번역 입력</h1>
        <p className="mt-1 text-sm text-zinc-500">단락 단위로 묶인 문장마다 번역을 입력하세요.</p>
      </header>

      <div role="status" aria-live="polite" className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-600">
        {doneSentences}/{totalSentences} 문장 완료
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group, gi) => (
          <section key={gi} className="rounded-lg border border-zinc-200 bg-white p-4">
            <p className="mb-3 text-xs font-medium text-zinc-400">{gi + 1}번째 단락</p>
            <div className="flex flex-col gap-3">
              {group.sentences.map((sentence, si) => (
                <div key={si} className="flex flex-col gap-1.5">
                  <p className="text-sm text-zinc-800">{sentence.source}</p>
                  <textarea
                    ref={autoResize}
                    rows={1}
                    value={sentence.translation}
                    onChange={(e) => {
                      updateTranslation(gi, si, e.target.value);
                      autoResize(e.currentTarget);
                    }}
                    disabled={analyzing}
                    aria-label={`${gi + 1}번째 단락 ${si + 1}번째 문장 번역`}
                    className="resize-none overflow-hidden rounded-lg border border-zinc-300 bg-white p-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
                    placeholder="번역을 입력하세요"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => void handleAnalyze()}
        disabled={!allDone || analyzing}
        aria-label="분석 시작"
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {analyzing ? "분석 중..." : "분석 시작"}
      </button>
    </>
  );
}
