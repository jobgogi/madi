import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { TranslationAnalysisReport } from "@/lib/analysis-schema";
import type { Provider } from "@/lib/settings";

// analysis-schema.ts나 이 파일의 구조가 바뀌면 예전 기록을 새 UI가 읽다가
// 깨질 수 있으므로, 버전을 찍어두고 안 맞는 기록은 로드 시 걸러낸다.
const SCHEMA_VERSION = 1;

export interface SentenceResult {
  sourceText: string;
  userTranslation: string;
  report: TranslationAnalysisReport;
  durationMs?: number;
}

export interface HistorySession {
  id: string;
  createdAt: number;
  schemaVersion: number;
  provider: Provider;
  sentences: SentenceResult[];
}

const STORAGE_KEY = "madi:history";
const MAX_SESSIONS = 200;

function isHistorySession(value: unknown): value is HistorySession {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "schemaVersion" in value &&
    "sentences" in value &&
    Array.isArray((value as { sentences: unknown }).sentences) &&
    (value as { sentences: unknown[] }).sentences.length > 0 &&
    (value as { schemaVersion: unknown }).schemaVersion === SCHEMA_VERSION
  );
}

export function loadSessions(): HistorySession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistorySession);
  } catch {
    return [];
  }
}

export function getSession(id: string): HistorySession | null {
  return loadSessions().find((s) => s.id === id) ?? null;
}

function saveAll(sessions: HistorySession[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function addSession(
  provider: Provider,
  sentences: SentenceResult[],
): HistorySession {
  const session: HistorySession = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    schemaVersion: SCHEMA_VERSION,
    provider,
    sentences,
  };
  if (typeof window !== "undefined") {
    const updated = [session, ...loadSessions()].slice(0, MAX_SESSIONS);
    saveAll(updated);
  }
  return session;
}

// "번역 수정 후 재분석" - 세션 내 한 문장의 결과만 교체한다.
export function updateSessionSentence(
  sessionId: string,
  index: number,
  sentence: SentenceResult,
): HistorySession | null {
  if (typeof window === "undefined") return null;
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session || !session.sentences[index]) return null;
  session.sentences[index] = sentence;
  saveAll(sessions);
  return session;
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;
  saveAll(loadSessions().filter((s) => s.id !== id));
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// 세션의 대표 난이도 - 카드 요약/그룹핑에는 첫 문장 기준을 쓴다 (문장마다
// 난이도가 다를 수 있지만, 목록 단순화를 위한 근사치).
export function sessionHeadline(session: HistorySession) {
  const first = session.sentences[0];
  const criticalCount = session.sentences.reduce(
    (sum, s) =>
      sum + s.report.grammar_points.filter((p) => p.severity === "critical").length,
    0,
  );
  return {
    sourceText: first.sourceText,
    level: first.report.difficulty.level,
    criticalCount,
    sentenceCount: session.sentences.length,
  };
}

// "분석 시작" 클릭 시 예상 소요 시간 표시용 - 같은 provider의 과거 문장당
// 평균 소요 시간. 기록이 없으면 null.
export function getAverageDurationMs(provider: Provider): number | null {
  const durations = loadSessions()
    .filter((s) => s.provider === provider)
    .flatMap((s) => s.sentences.map((sentence) => sentence.durationMs))
    .filter((d): d is number => typeof d === "number");
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

// 대시보드/전체 기록 페이지가 공유하는 "마운트 후 localStorage에서 세션 목록을
// 한 번 읽기" 훅 (SSR/hydration 안전). setter도 함께 반환해 삭제 등 로컬
// 갱신이 필요한 쪽에서 쓸 수 있게 한다.
export function useSessions(): [
  HistorySession[] | null,
  Dispatch<SetStateAction<HistorySession[] | null>>,
] {
  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loadSessions());
  }, []);
  return [sessions, setSessions];
}
