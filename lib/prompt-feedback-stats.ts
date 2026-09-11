export interface FeedbackCounts {
  good: number;
  bad: number;
}

// 관리자가 프롬프트 템플릿 버전별 평가를 보기 위한 집계 - reports.prompt_template_id로
// 리포트와 템플릿을 잇고, session_feedback.report_id로 리포트와 피드백을 이어서
// 템플릿별 good/bad 개수를 센다. 둘 다 admin 전용 조회 RLS로 얻은 원본 row를 그대로
// 받는다 (app/admin/prompt-templates).
export function aggregateFeedbackByTemplate(
  reports: { id: string; prompt_template_id: string | null }[],
  feedback: { report_id: string; feedback: "good" | "bad" }[],
): Record<string, FeedbackCounts> {
  const reportToTemplate = new Map(
    reports.filter((r) => r.prompt_template_id).map((r) => [r.id, r.prompt_template_id as string]),
  );

  const counts: Record<string, FeedbackCounts> = {};
  for (const fb of feedback) {
    const templateId = reportToTemplate.get(fb.report_id);
    if (!templateId) continue;
    counts[templateId] ??= { good: 0, bad: 0 };
    counts[templateId][fb.feedback]++;
  }
  return counts;
}
