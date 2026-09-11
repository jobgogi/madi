"use client";

import { useState } from "react";
import { useErrorCategories } from "@/lib/hooks/useErrorCategories";

export default function ErrorCategoriesPage() {
  const { categories, updateLabel } = useErrorCategories();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  if (!categories) {
    return (
      <div role="status" aria-live="polite" className="text-sm text-zinc-500">
        불러오는 중...
      </div>
    );
  }

  async function handleSave(code: string) {
    const label = (drafts[code] ?? "").trim();
    if (!label) return;
    setSavingCode(code);
    setErrorCode(null);
    const ok = await updateLabel(code, label);
    setSavingCode(null);
    if (!ok) setErrorCode(code);
    else
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium text-zinc-900">에러 카테고리 라벨</h2>
      <p className="text-sm text-zinc-500">10종 카테고리의 표시 라벨을 수정합니다. 코드 추가/삭제는 지원하지 않습니다.</p>

      <ul className="flex flex-col gap-3">
        {categories.map((category) => {
          const draft = drafts[category.code] ?? category.label;
          const dirty = draft !== category.label;
          return (
            <li
              key={category.code}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-mono text-xs text-zinc-500">{category.code}</span>
              <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
                <input
                  value={draft}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [category.code]: e.target.value }))}
                  aria-label={`${category.code} 라벨`}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <button
                  type="button"
                  disabled={!dirty || savingCode === category.code}
                  onClick={() => void handleSave(category.code)}
                  className="shrink-0 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {savingCode === category.code ? "저장 중..." : "저장"}
                </button>
              </div>
              {errorCode === category.code && <p className="text-xs text-red-600">저장에 실패했습니다. 다시 시도해주세요.</p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
