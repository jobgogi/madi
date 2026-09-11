import type { DifficultyLevel } from "@/lib/analysis-schema";

// 리포트/히스토리 페이지가 같은 난이도 배지 색상을 쓰도록 공유. JLPT(N5~N1)와
// TOPIK(1급~6급) 둘 다 쉬움→어려움 순으로 같은 색상 단계를 쓴다.
export const LEVEL_STYLE: Record<DifficultyLevel, string> = {
  N5: "bg-emerald-100 text-emerald-800",
  N4: "bg-lime-100 text-lime-800",
  N3: "bg-amber-100 text-amber-800",
  N2: "bg-orange-100 text-orange-800",
  N1: "bg-red-100 text-red-800",
  "1급": "bg-emerald-100 text-emerald-800",
  "2급": "bg-lime-100 text-lime-800",
  "3급": "bg-amber-100 text-amber-800",
  "4급": "bg-orange-100 text-orange-800",
  "5급": "bg-red-100 text-red-800",
  "6급": "bg-red-200 text-red-900",
};
