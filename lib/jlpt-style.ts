import type { JlptLevel } from "@/lib/analysis-schema";

// 리포트/히스토리 페이지가 같은 JLPT 등급 배지 색상을 쓰도록 공유.
export const JLPT_STYLE: Record<JlptLevel, string> = {
  N5: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  N4: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300",
  N3: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  N2: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  N1: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};
