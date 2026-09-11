import { createClient } from "@/lib/supabase/client";
import { aggregateFeedbackByTemplate, type FeedbackCounts } from "@/lib/prompt-feedback-stats";
import { useAsyncData } from "./useAsyncData";

async function load(): Promise<Record<string, FeedbackCounts>> {
  const supabase = createClient();
  const [reportsRes, feedbackRes] = await Promise.all([
    supabase.from("reports").select("id, prompt_template_id"),
    supabase.from("session_feedback").select("report_id, feedback"),
  ]);
  if (reportsRes.error) console.error("usePromptFeedbackStats: reports load failed", reportsRes.error);
  if (feedbackRes.error) console.error("usePromptFeedbackStats: session_feedback load failed", feedbackRes.error);
  return aggregateFeedbackByTemplate(reportsRes.data ?? [], feedbackRes.data ?? []);
}

// 관리자가 프롬프트 템플릿 버전별로 실제 평가(👍/👎)가 어땠는지 보기 위한 집계 -
// app/admin/prompt-templates에서 각 버전 옆에 배지로 표시.
export function usePromptFeedbackStats(): Record<string, FeedbackCounts> | null {
  const { data } = useAsyncData(load, []);
  return data;
}
