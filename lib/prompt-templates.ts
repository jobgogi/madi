import type { Direction } from "@/lib/analysis-schema";

// 이 모듈 top-level에서 "@/lib/supabase/client"를 정적 import하면 vitest(SSR
// 트랜스폼)에서 @supabase/auth-js의 webauthn.ts <-> webauthn.errors.ts 순환
// 참조가 깨지며 테스트 파일 로드 자체가 실패한다(이 프로젝트 vitest 환경에서
// 재현 확인, 순수 함수 로직과는 무관). 아래 함수들에서 지연 import로 우회한다.

export interface PromptTemplate {
  id: string;
  direction: Direction;
  version: number;
  content: string;
  isActive: boolean;
  createdAt: number;
}

interface PromptTemplateRow {
  id: string;
  direction: Direction;
  version: number;
  content: string;
  is_active: boolean;
  created_at: string;
}

function rowToTemplate(row: PromptTemplateRow): PromptTemplate {
  return {
    id: row.id,
    direction: row.direction,
    version: row.version,
    content: row.content,
    isActive: row.is_active,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function groupByDirectionSorted(templates: PromptTemplate[]): Record<Direction, PromptTemplate[]> {
  const groups: Record<Direction, PromptTemplate[]> = { ja_to_ko: [], ko_to_ja: [] };
  for (const template of templates) groups[template.direction].push(template);
  for (const direction of Object.keys(groups) as Direction[]) {
    groups[direction].sort((a, b) => b.version - a.version);
  }
  return groups;
}

export function nextVersion(templates: PromptTemplate[], direction: Direction): number {
  const versions = templates.filter((t) => t.direction === direction).map((t) => t.version);
  return versions.length === 0 ? 1 : Math.max(...versions) + 1;
}

// 활성화 대상(targetId)과 같은 방향에서 현재 활성 상태인 다른 템플릿의 id.
// 없으면(이미 활성이거나 활성 템플릿 자체가 없으면) null - 그 경우 끌 것이 없다.
export function idToDeactivate(templates: PromptTemplate[], targetId: string): string | null {
  const target = templates.find((t) => t.id === targetId);
  if (!target) return null;
  const current = templates.find((t) => t.direction === target.direction && t.isActive && t.id !== targetId);
  return current?.id ?? null;
}

export async function loadPromptTemplates(): Promise<PromptTemplate[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prompt_templates")
    .select("id, direction, version, content, is_active, created_at")
    .order("version", { ascending: false });
  if (error) {
    console.error("loadPromptTemplates failed", error);
    return [];
  }
  return (data as PromptTemplateRow[]).map(rowToTemplate);
}

export async function createPromptTemplate(direction: Direction, version: number, content: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("prompt_templates").insert({ direction, version, content, is_active: false });
  if (error) throw error;
}

// 방향당 활성 템플릿 최대 1개 제약(DB 부분 유니크 인덱스)이 있으므로
// 기존 활성 템플릿을 먼저 끄고 나서 새 템플릿을 켠다.
export async function activatePromptTemplate(templates: PromptTemplate[], targetId: string): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const deactivateId = idToDeactivate(templates, targetId);
  if (deactivateId) {
    const { error: deactivateError } = await supabase
      .from("prompt_templates")
      .update({ is_active: false })
      .eq("id", deactivateId);
    if (deactivateError) throw deactivateError;
  }
  const { error: activateError } = await supabase.from("prompt_templates").update({ is_active: true }).eq("id", targetId);
  if (activateError) throw activateError;
}
