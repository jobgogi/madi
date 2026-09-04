import Link from "next/link";
import { sessionHeadline, type HistorySession } from "@/lib/history";
import { JLPT_STYLE } from "@/lib/jlpt-style";

const PROVIDER_LABEL: Record<HistorySession["provider"], string> = {
  claude: "Claude",
  openai: "ChatGPT",
  gemini: "Gemini",
};

const DIRECTION_BADGE: Record<HistorySession["direction"], string> = {
  ja_to_ko: "일→한",
  ko_to_ja: "한→일",
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("ko-KR", {
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

  return (
    <li className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
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
          className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          aria-label={
            session.direction === "ja_to_ko" ? "일본어에서 한국어로" : "한국어에서 일본어로"
          }
        >
          {DIRECTION_BADGE[session.direction]}
        </span>
        <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
          {truncate(sourceText, 40)}
          {sentenceCount > 1 ? ` 외 ${sentenceCount - 1}문장` : ""}
        </span>
        {criticalCount > 0 && (
          <span
            className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300"
            aria-label={`심각 오류 ${criticalCount}건`}
          >
            심각 {criticalCount}
          </span>
        )}
        <span className="hidden shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
          {PROVIDER_LABEL[session.provider]}
        </span>
        <span className="hidden shrink-0 text-xs text-zinc-400 sm:inline dark:text-zinc-500">
          {formatDate(session.createdAt)}
        </span>
      </Link>
      {onDelete && (
        <button
          type="button"
          aria-label="이 기록 삭제"
          onClick={() => onDelete(session.id)}
          className="shrink-0 text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          삭제
        </button>
      )}
    </li>
  );
}
