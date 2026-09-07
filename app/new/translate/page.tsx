"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlow } from "../flow-context";
import { buildMockReport } from "../mock-report";

export default function TranslatePage() {
  const router = useRouter();
  const { paragraphs, groups, setGroups, direction, setReport } = useFlow();

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

  function handleAnalyze() {
    setReport(buildMockReport(groups, direction));
    router.push("/new/report");
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
                  <input
                    type="text"
                    value={sentence.translation}
                    onChange={(e) => updateTranslation(gi, si, e.target.value)}
                    aria-label={`${gi + 1}번째 단락 ${si + 1}번째 문장 번역`}
                    className="rounded-lg border border-zinc-300 bg-white p-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    placeholder="번역을 입력하세요"
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={!allDone}
        aria-label="분석 시작"
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        분석 시작
      </button>
    </>
  );
}
