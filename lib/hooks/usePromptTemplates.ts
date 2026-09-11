import {
  activatePromptTemplate,
  createPromptTemplate,
  loadPromptTemplates,
  nextVersion,
  type PromptTemplate,
} from "@/lib/prompt-templates";
import type { Direction } from "@/lib/analysis-schema";
import { useAsyncData } from "./useAsyncData";

// 프롬프트 템플릿 관리 화면의 데이터 계층 - lib/hooks/useSessions.ts와 같은
// "마운트 후 조회, mutation 후 재조회" 패턴.
export function usePromptTemplates(): {
  templates: PromptTemplate[] | null;
  create: (direction: Direction, content: string) => Promise<void>;
  activate: (id: string) => Promise<void>;
} {
  const { data: templates, setData: setTemplates } = useAsyncData(loadPromptTemplates, []);

  async function refresh(): Promise<void> {
    setTemplates(await loadPromptTemplates());
  }

  async function create(direction: Direction, content: string): Promise<void> {
    await createPromptTemplate(direction, nextVersion(templates ?? [], direction), content);
    await refresh();
  }

  async function activate(id: string): Promise<void> {
    if (!templates) return;
    await activatePromptTemplate(templates, id);
    await refresh();
  }

  return { templates, create, activate };
}
