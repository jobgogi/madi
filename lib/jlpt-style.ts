import type { JlptLevel } from "@/lib/analysis-schema";

// 리포트/히스토리 페이지가 같은 JLPT 등급 배지 색상을 쓰도록 공유.
export const JLPT_STYLE: Record<JlptLevel, string> = {
  N5: "bg-emerald-100 text-emerald-800",
  N4: "bg-lime-100 text-lime-800",
  N3: "bg-amber-100 text-amber-800",
  N2: "bg-orange-100 text-orange-800",
  N1: "bg-red-100 text-red-800",
};
