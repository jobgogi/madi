"use client";

import { useState } from "react";
import { usePromptTemplates } from "@/lib/hooks/usePromptTemplates";
import { groupByDirectionSorted } from "@/lib/prompt-templates";
import { DIRECTIONS, DIRECTION_LANG, type Direction, type TranslationAnalysisReport } from "@/lib/analysis-schema";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { usePromptFeedbackStats } from "@/lib/hooks/usePromptFeedbackStats";
import { LOCKED_PROMPT_RULES } from "@/lib/prompt-rules";

function directionLabel(direction: Direction): string {
  const { source, target } = DIRECTION_LANG[direction];
  return `${source} → ${target}`;
}

// 저장/활성화 전 초안 프롬프트를 실제 LLM으로 테스트해보는 패널.
// app/api/admin/prompt-preview를 호출한다 - DB를 거치지 않고 지금 입력창에
// 있는 content를 그대로 시스템 프롬프트로 사용해서, 활성화하기 전에 결과를 미리 볼 수 있다.
function PromptTestPanel({ direction, content }: { direction: Direction; content: string }) {
  const { language } = useNativeLanguage();
  const [sourceText, setSourceText] = useState("");
  const [userTranslation, setUserTranslation] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<TranslationAnalysisReport | null>(null);

  async function handleRun(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setReport(null);

    if (!content.trim()) {
      setError("위 프롬프트 내용을 먼저 입력해주세요.");
      return;
    }

    setRunning(true);
    try {
      const res = await fetch("/api/admin/prompt-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          nativeLanguage: language ?? "ko",
          promptContent: content,
          sentences: [{ sourceText, userTranslation }],
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const message = (data as { error?: string }).error ?? "테스트 실행에 실패했습니다.";
        setError(message);
        return;
      }
      setReport((data as { reports: TranslationAnalysisReport[] }).reports[0]);
    } catch {
      setError("테스트 실행 중 오류가 발생했습니다.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">테스트 실행 (저장 전 미리보기)</h3>
      <p className="text-xs text-zinc-500">
        위 입력창의 프롬프트 내용을 그대로 사용해 실제 LLM을 호출합니다. 서버에 등록된 테스트 전용 API 키(.env의 PROMPT_TEST_*)가 사용됩니다.
      </p>
      <form onSubmit={handleRun} className="flex flex-col gap-2">
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          rows={2}
          placeholder={`원문 (${DIRECTION_LANG[direction].source})`}
          aria-label="테스트 원문"
          className="rounded-md border border-zinc-300 p-2 text-sm"
        />
        <textarea
          value={userTranslation}
          onChange={(e) => setUserTranslation(e.target.value)}
          rows={2}
          placeholder={`번역 (${DIRECTION_LANG[direction].target})`}
          aria-label="테스트 번역"
          className="rounded-md border border-zinc-300 p-2 text-sm"
        />
        <button
          type="submit"
          disabled={running || !sourceText.trim() || !userTranslation.trim()}
          className="self-start rounded-full border border-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-900 hover:text-white disabled:opacity-50"
        >
          {running ? "실행 중..." : "테스트 실행"}
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {report && (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
          <p>
            <span className="font-medium">난이도:</span> {report.difficulty.level} — {report.difficulty.comment}
          </p>
          <p>
            <span className="font-medium">총평:</span> {report.overall_comment}
          </p>
          <p>
            <span className="font-medium">지적 사항:</span> {report.grammar_points.length}건
          </p>
          {report.grammar_points.map((gp, i) => (
            <p key={i} className="pl-2 text-zinc-600">
              [{gp.severity}] {gp.category} — {gp.comment}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

interface ResolveResult {
  resolved: string;
  unresolvedPlaceholders: string[];
}

// 저장/활성화 전에 {{explanationLang}} 등 플레이스홀더가 실제로 치환되는지
// LLM 호출 없이 눈으로 확인하는 패널. app/api/admin/prompt-resolve를
// 모국어(ko/ja) 두 값으로 각각 호출한다. 문자열 정확 일치에 의존하는
// DB replace() 마이그레이션이 조용히 실패했던 사고(2026-09-11)의 재발을
// 막기 위해 추가 - resolved 안에 "{{...}}"가 남아있으면 경고를 보여준다.
function ResolvedPromptPreview({ content }: { content: string }) {
  const [results, setResults] = useState<Record<"ko" | "ja", ResolveResult> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResolve(): Promise<void> {
    if (!content.trim()) {
      setError("프롬프트 내용이 없습니다.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ko, ja] = await Promise.all(
        (["ko", "ja"] as const).map(async (nativeLanguage) => {
          const res = await fetch("/api/admin/prompt-resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, nativeLanguage }),
          });
          const data: unknown = await res.json();
          if (!res.ok) throw new Error((data as { error?: string }).error ?? "치환 결과를 가져오지 못했습니다.");
          return data as ResolveResult;
        }),
      );
      setResults({ ko, ja });
    } catch (err) {
      setError(err instanceof Error ? err.message : "치환 결과를 가져오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void handleResolve()}
        disabled={loading}
        className="self-start rounded-full border border-zinc-400 px-3 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50"
      >
        {loading ? "확인 중..." : "치환 결과 미리보기 (모국어 한국어/일본어 각각)"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {results &&
        (["ko", "ja"] as const).map((lang) => {
          const r = results[lang];
          return (
            <details key={lang} className="rounded-md border border-zinc-200 bg-white p-2 text-xs">
              <summary className="cursor-pointer font-medium text-zinc-700">
                모국어={lang === "ko" ? "한국어" : "일본어"} 치환 결과
                {r.unresolvedPlaceholders.length > 0 && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                    ⚠ 치환 안 된 플레이스홀더: {r.unresolvedPlaceholders.join(", ")}
                  </span>
                )}
              </summary>
              <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-zinc-600">{r.resolved}</pre>
            </details>
          );
        })}
    </div>
  );
}

export function PromptTemplatesClient() {
  const { templates, create, activate } = usePromptTemplates();
  const feedbackStats = usePromptFeedbackStats();
  const [direction, setDirection] = useState<Direction>("ja_to_ko");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  if (!templates) {
    return (
      <div role="status" aria-live="polite" className="text-sm text-zinc-500">
        불러오는 중...
      </div>
    );
  }

  const grouped = groupByDirectionSorted(templates);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await create(direction, content.trim());
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id: string): Promise<void> {
    setActivatingId(id);
    try {
      await activate(id);
    } finally {
      setActivatingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">새 버전 작성</h2>
        <div className="flex gap-4 text-sm text-zinc-700">
          {DIRECTIONS.map((d) => (
            <label key={d} className="flex items-center gap-1.5">
              <input type="radio" name="direction" checked={direction === d} onChange={() => setDirection(d)} />
              {directionLabel(d)}
            </label>
          ))}
        </div>
        <div className="rounded-md border border-dashed border-zinc-300 bg-white p-2 text-xs text-zinc-500">
          <p className="font-medium text-zinc-600">아래 플레이스홀더는 요청 시점에 자동 치환됩니다 - 본문에 그대로 넣어 사용하세요.</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            <li>
              <code className="rounded bg-zinc-100 px-1">{"{{explanationLang}}"}</code> — 사용자 모국어 이름(한국어/일본어)으로
              치환. comment/meaning 등 설명 텍스트를 어느 언어로 쓸지 지시할 때 사용.
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">{"{{vocabularyLanguage}}"}</code> — vocabulary_diff[].word가 어느
              언어여야 하는지(모국어의 반대쪽 언어) 지시문으로 치환. direction이 아니라 모국어 기준.
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">{"{{difficultyGuidance}}"}</code> — difficulty.level 판정 대상과
              척도(일본어=JLPT, 한국어=TOPIK) 지시문으로 치환. 역시 모국어 기준.
            </li>
            <li>
              <code className="rounded bg-zinc-100 px-1">{"{{readingGuidance}}"}</code> — 모국어에 따라 vocabulary_diff[].reading
              지시문(가타카나/후리가나 등)으로 치환. word 항목 안내 근처에 배치.
            </li>
          </ul>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="프롬프트 내용"
          aria-label="프롬프트 내용"
          className="rounded-md border border-zinc-300 p-2 text-sm"
        />
        <details className="rounded-md border border-dashed border-zinc-300 bg-white p-2 text-xs text-zinc-500">
          <summary className="cursor-pointer select-none font-medium text-zinc-600">
            아래 내용은 자동으로 뒤에 고정 추가됩니다 (수정 불가)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap">{LOCKED_PROMPT_RULES}</pre>
        </details>
        <ResolvedPromptPreview content={content} />
        <button
          type="submit"
          disabled={saving || !content.trim()}
          className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
        >
          {saving ? "저장 중..." : "새 버전 저장"}
        </button>
      </form>

      <PromptTestPanel direction={direction} content={content} />

      {DIRECTIONS.map((d) => (
        <section key={d} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-zinc-900">{directionLabel(d)}</h2>
          {grouped[d].length === 0 ? (
            <p className="text-sm text-zinc-400">템플릿이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {grouped[d].map((t) => (
                <li key={t.id} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900">v{t.version}</span>
                      {feedbackStats && (
                        <span className="text-xs text-zinc-400">
                          👍 {feedbackStats[t.id]?.good ?? 0} · 👎 {feedbackStats[t.id]?.bad ?? 0}
                        </span>
                      )}
                    </div>
                    {t.isActive ? (
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">활성</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleActivate(t.id)}
                        disabled={activatingId === t.id}
                        className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline disabled:opacity-50"
                      >
                        {activatingId === t.id ? "활성화 중..." : "활성화"}
                      </button>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-zinc-600">{t.content}</pre>
                  <ResolvedPromptPreview content={t.content} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
