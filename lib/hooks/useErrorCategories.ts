import { listErrorCategories, updateErrorCategoryLabel, type ErrorCategory } from "@/lib/error-categories";
import { useAsyncData } from "./useAsyncData";

// 에러 카테고리 관리 화면의 데이터 계층 - 목록 조회 + label 수정을
// optimistic하게 반영(실패 시 서버 원본으로 롤백).
export function useErrorCategories(): {
  categories: ErrorCategory[] | null;
  updateLabel: (code: string, label: string) => Promise<boolean>;
} {
  const { data: categories, setData: setCategories } = useAsyncData(listErrorCategories, []);

  async function updateLabel(code: string, label: string): Promise<boolean> {
    const prev = categories;
    setCategories((cur) => cur?.map((c) => (c.code === code ? { ...c, label } : c)) ?? cur);
    const ok = await updateErrorCategoryLabel(code, label);
    if (!ok) setCategories(prev);
    return ok;
  }

  return { categories, updateLabel };
}
