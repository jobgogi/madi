import { z } from "zod/v4";
import { TranslationAnalysisReportSchema, type Direction } from "@/lib/analysis-schema";
import type { Provider } from "@/lib/settings";
import { createClient } from "@/lib/supabase/client";

export interface SentenceResult {
  sourceText: string;
  userTranslation: string;
  report: z.infer<typeof TranslationAnalysisReportSchema>;
  durationMs?: number;
}

export interface HistorySession {
  id: string;
  createdAt: number;
  provider: Provider;
  direction: Direction;
  sentences: SentenceResult[];
}

// AI 분석 결과가 그대로 들어있는 컬럼이라 DB에서 읽어올 때도 zod로 한 번
// 검증한다 - 문장이 하나도 없는 행이나 스키마가 안 맞는 행은 걸러낸다.
const SentenceResultSchema = z.object({
  sourceText: z.string(),
  userTranslation: z.string(),
  report: TranslationAnalysisReportSchema,
  durationMs: z.number().optional(),
});
const SentencesSchema = z.array(SentenceResultSchema).min(1);

const MAX_SESSIONS = 200;

interface ReportRow {
  id: string;
  direction: Direction;
  provider: Provider;
  created_at: string;
  sentences: unknown;
}

function rowToSession(row: ReportRow): HistorySession | null {
  const parsed = SentencesSchema.safeParse(row.sentences);
  if (!parsed.success) return null;
  return {
    id: row.id,
    createdAt: new Date(row.created_at).getTime(),
    provider: row.provider,
    direction: row.direction,
    sentences: parsed.data,
  };
}

const REPORT_COLUMNS = "id, direction, provider, created_at, sentences";

export async function loadSessions(): Promise<HistorySession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(REPORT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(MAX_SESSIONS);
  if (error) {
    console.error("loadSessions failed", error);
    return [];
  }
  return data.map(rowToSession).filter((s): s is HistorySession => s !== null);
}

export async function getSession(id: string): Promise<HistorySession | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("reports").select(REPORT_COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) {
    if (error) console.error("getSession failed", error);
    return null;
  }
  return rowToSession(data);
}

export async function addSession(
  provider: Provider,
  direction: Direction,
  sentences: SentenceResult[],
): Promise<HistorySession | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("reports")
    .insert({ user_id: user.id, provider, direction, sentences })
    .select(REPORT_COLUMNS)
    .single();
  if (error || !data) {
    if (error) console.error("addSession failed", error);
    return null;
  }
  return rowToSession(data);
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) console.error("deleteSession failed", error);
}

export async function clearHistory(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("reports").delete().eq("user_id", user.id);
  if (error) console.error("clearHistory failed", error);
}

// 세션의 대표 난이도 - 카드 요약/그룹핑에는 첫 문장 기준을 쓴다 (문장마다
// 난이도가 다를 수 있지만, 목록 단순화를 위한 근사치).
export function sessionHeadline(session: HistorySession) {
  const first = session.sentences[0];
  const criticalCount = session.sentences.reduce(
    (sum, s) => sum + s.report.grammar_points.filter((p) => p.severity === "critical").length,
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
export async function getAverageDurationMs(provider: Provider): Promise<number | null> {
  const sessions = (await loadSessions()).filter((s) => s.provider === provider);
  const durations = sessions
    .flatMap((s) => s.sentences.map((sentence) => sentence.durationMs))
    .filter((d): d is number => typeof d === "number");
  if (durations.length === 0) return null;
  return durations.reduce((sum, d) => sum + d, 0) / durations.length;
}

export interface PastSourceEntry {
  sourceText: string;
  direction: Direction;
}

// "이전 원문 불러오기" 팝업에 띄울 목록 - 과거에 연습했던 원문들을 최신 세션
// 순으로, 방향 구분 없이 전부 모은다 (골라진 항목의 방향으로 자동 전환되므로
// 여기서는 방향으로 거르지 않는다). 각 항목은 실제로 분석됐던 단위
// (session.sentences[].sourceText) 그대로 보여준다. 같은 문장은 한 번만 보여준다.
export async function pastSourceEntries(): Promise<PastSourceEntry[]> {
  const seen = new Set<string>();
  const entries: PastSourceEntry[] = [];
  for (const session of await loadSessions()) {
    for (const sentence of session.sentences) {
      const key = `${session.direction}:${sentence.sourceText}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ sourceText: sentence.sourceText, direction: session.direction });
    }
  }
  return entries;
}
