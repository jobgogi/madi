import { describe, expect, it } from "vitest";
import { aggregateFeedbackByTemplate } from "./prompt-feedback-stats";

describe("aggregateFeedbackByTemplate", () => {
  it("report_id -> prompt_template_id를 따라가 템플릿별 good/bad 개수를 센다", () => {
    const reports = [
      { id: "r1", prompt_template_id: "t1" },
      { id: "r2", prompt_template_id: "t1" },
      { id: "r3", prompt_template_id: "t2" },
    ];
    const feedback: { report_id: string; feedback: "good" | "bad" }[] = [
      { report_id: "r1", feedback: "good" },
      { report_id: "r2", feedback: "bad" },
      { report_id: "r3", feedback: "good" },
    ];

    const result = aggregateFeedbackByTemplate(reports, feedback);

    expect(result.t1).toEqual({ good: 1, bad: 1 });
    expect(result.t2).toEqual({ good: 1, bad: 0 });
  });

  it("prompt_template_id가 null인 리포트에 달린 피드백은 무시한다", () => {
    const reports = [{ id: "r1", prompt_template_id: null }];
    const feedback: { report_id: string; feedback: "good" | "bad" }[] = [{ report_id: "r1", feedback: "good" }];

    expect(aggregateFeedbackByTemplate(reports, feedback)).toEqual({});
  });

  it("피드백이 없는 템플릿은 결과에 포함하지 않는다", () => {
    const reports = [{ id: "r1", prompt_template_id: "t1" }];
    expect(aggregateFeedbackByTemplate(reports, [])).toEqual({});
  });
});
