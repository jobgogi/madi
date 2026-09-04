import type { Severity } from "@/lib/analysis-schema";

// AnalysisReportView와 종합 분석 페이지가 같은 severity 배지 스타일을 쓰도록 공유.
export const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  warning:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  info: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "심각 (의미 왜곡)",
  warning: "경고",
  info: "참고",
};

// 심각도 우선순위 - critical이 항상 먼저 오도록 정렬/집계에 사용.
export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};
