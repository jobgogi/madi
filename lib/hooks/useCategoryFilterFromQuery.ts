import { useEffect, useState } from "react";
import { POINT_CATEGORIES } from "@/lib/analysis-schema";
import type { PointCategory } from "@/lib/dashboard-stats";

function isPointCategory(value: string | null): value is PointCategory {
  return value !== null && (POINT_CATEGORIES as readonly string[]).includes(value);
}

// 대시보드 카테고리 카드에서 넘어온 ?category= 쿼리를 읽는다 - 마운트 후
// 클라이언트에서만 읽는다 (SSR/hydration 안전).
export function useCategoryFilterFromQuery(): PointCategory | null {
  const [category, setCategory] = useState<PointCategory | null>(null);
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("category");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategory(isPointCategory(param) ? param : null);
  }, []);
  return category;
}
