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
                      {feedbackStats?.[t.id] && (
                        <span className="text-xs text-zinc-400">
                          👍 {feedbackStats[t.id].good} · 👎 {feedbackStats[t.id].bad}
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
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
