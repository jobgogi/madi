"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIRECTIONS, type Direction } from "@/lib/analysis-schema";
import { useHasApiKey } from "@/lib/hooks/useHasApiKey";
import { SourceEditor } from "@/components/SourceEditor";
import { buildParagraphGroups, useFlow } from "./flow-context";

const DIRECTION_LABEL: Record<Direction, string> = {
  ja_to_ko: "일본어 → 한국어",
  ko_to_ja: "한국어 → 일본어",
};

export default function NewSourcePage() {
  const router = useRouter();
  const { direction, setDirection, paragraphs, setParagraphs, setGroups } = useFlow();
  const hasApiKey = useHasApiKey();

  function handleNext() {
    if (paragraphs.length === 0) return;
    setGroups(buildParagraphGroups(paragraphs));
    router.push("/new/translate");
  }

  return (
    <>
      <header>
        <h1 className="text-xl font-semibold text-zinc-900">새 학습 — 원문 입력</h1>
        <p className="mt-1 text-sm text-zinc-500">
          단락 구조를 유지한 채 원문을 입력하세요. 다음 단계에서 단락별로 문장을 나눠 번역합니다.
        </p>
      </header>

      {hasApiKey === false && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          아직 AI 모델이 설정되지 않았습니다.{" "}
          <Link href="/settings" className="font-medium underline">
            설정 화면
          </Link>
          에서 API 키를 먼저 등록해주세요.
        </div>
      )}

      <div className="flex gap-2" role="group" aria-label="번역 방향 선택">
        {DIRECTIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDirection(d)}
            aria-pressed={direction === d}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              direction === d
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {DIRECTION_LABEL[d]}
          </button>
        ))}
      </div>

      <SourceEditor onChangeParagraphs={setParagraphs} placeholder="원문을 입력하세요 (단락 구분 유지)" />

      <button
        type="button"
        onClick={handleNext}
        disabled={paragraphs.length === 0}
        aria-label="다음 단계로"
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        다음
      </button>
    </>
  );
}
