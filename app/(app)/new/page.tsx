"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIRECTIONS } from "@/lib/analysis-schema";
import { useHasApiKey } from "@/lib/hooks/useHasApiKey";
import { useLocale } from "@/lib/hooks/useLocale";
import { newFlow } from "@/lib/i18n/new";
import { SourceEditor } from "@/components/SourceEditor";
import { buildParagraphGroups, useFlow } from "./flow-context";

export default function NewSourcePage() {
  const router = useRouter();
  const { direction, setDirection, paragraphs, setParagraphs, setGroups } = useFlow();
  const hasApiKey = useHasApiKey();
  const t = newFlow[useLocale()];

  function handleNext() {
    if (paragraphs.length === 0) return;
    setGroups(buildParagraphGroups(paragraphs));
    router.push("/new/translate");
  }

  return (
    <>
      <header>
        <h1 className="text-xl font-semibold text-zinc-900">{t.sourceTitle}</h1>
        <p className="mt-1 text-sm text-zinc-500">{t.sourceDescription}</p>
      </header>

      {hasApiKey === false && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          {t.apiKeyMissing}{" "}
          <Link href="/settings" className="font-medium underline">
            {t.apiKeyMissingLinkLabel}
          </Link>
          {t.apiKeyMissingSuffix}
        </div>
      )}

      <div className="flex gap-2" role="group" aria-label={t.directionAria}>
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
            {t.directionLabel[d]}
          </button>
        ))}
      </div>

      <SourceEditor onChangeParagraphs={setParagraphs} placeholder={t.sourcePlaceholder} />

      <button
        type="button"
        onClick={handleNext}
        disabled={paragraphs.length === 0}
        aria-label={t.nextButtonAria}
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
      >
        {t.nextButton}
      </button>
    </>
  );
}
