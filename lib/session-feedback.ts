import { createClient } from "@/lib/supabase/client";

export type Feedback = "good" | "bad";

export async function getFeedback(reportId: string): Promise<Feedback | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("session_feedback")
    .select("feedback")
    .eq("report_id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("getFeedback failed", error);
    return null;
  }
  return data.feedback as Feedback;
}

export async function setFeedback(reportId: string, feedback: Feedback): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("session_feedback")
    .upsert({ report_id: reportId, user_id: user.id, feedback }, { onConflict: "report_id,user_id" });
  if (error) console.error("setFeedback failed", error);
}
