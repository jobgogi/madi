import Link from "next/link";
import { sessionHeadline, type HistorySession } from "@/lib/history";
import { JLPT_STYLE } from "@/lib/jlpt-style";
import { useLocale } from "@/lib/hooks/useLocale";
import { history } from "@/lib/i18n/history";
import type { NativeLanguage } from "@/lib/native-language";

const PROVIDER_LABEL: Record<HistorySession["provider"], string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

function formatDate(ts: number, locale: NativeLanguage): string {
  return new Date(ts).toLocaleString(locale === "ja" ? "ja-JP" : "ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function SessionCard({
  session,
  headline,
  onDelete,
}: {
  session: HistorySession;
  headline?: ReturnType<typeof sessionHeadline>;
  onDelete?: (id: string) => void;
}) {
  const { sourceText, level, criticalCount, sentenceCount } =
    headline ?? sessionHeadline(session);
  const locale = useLocale();
  const t = history[locale];

  return (
    <li className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm">
      {/* 삭제 버튼과 형제 관계로 두어, 인터랙티브 요소가 겹치지 않게 함
          (<button>을 <a> 안에 중첩하면 접근성/DOM 상 문제가 생김). */}
      <Link
        href={`/history/${session.id}`}
        className="flex min-w-0 flex-1 items-center gap-2 hover:underline"
      >
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${JLPT_STYLE[level]}`}
        >
          {level}
        </span>
        <span
          className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
          aria-label={t.directionAria[session.direction]}
        >
          {t.directionBadge[session.direction]}
        </span>
        <span className="min-w-0 flex-1 truncate text-zinc-800">
          {truncate(sourceText, 40)}
          {sentenceCount > 1 ? t.moreSentences(sentenceCount - 1) : ""}
        </span>
        {criticalCount > 0 && (
          <span
            className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
            aria-label={t.criticalAria(criticalCount)}
          >
            {t.criticalBadge(criticalCount)}
          </span>
        )}
        <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline">
          {PROVIDER_LABEL[session.provider]}
        </span>
        <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline">
          {formatDate(session.createdAt, locale)}
        </span>
      </Link>
      {onDelete && (
        <button
          type="button"
          aria-label={t.deleteShortAria}
          onClick={() => onDelete(session.id)}
          className="shrink-0 text-xs text-zinc-500 hover:text-red-600"
        >
          {t.deleteShort}
        </button>
      )}
    </li>
  );
}
