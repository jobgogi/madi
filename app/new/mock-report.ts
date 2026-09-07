import { POINT_CATEGORIES, SEVERITIES, type Direction, type Severity } from "@/lib/analysis-schema";
import type { ParagraphGroup } from "./flow-context";

export interface MockPoint {
  category: (typeof POINT_CATEGORIES)[number];
  severity: Severity;
  sourceText: string;
  comment: string;
}

export interface MockReport {
  overallComment: string;
  strengths: string[];
  points: MockPoint[];
  levelLabel: string;
}

const LEVEL_LABEL: Record<Direction, string> = {
  ja_to_ko: "N3 (JLPT, 목업)",
  ko_to_ja: "4급 (TOPIK, 목업)",
};

// 실제 AI 분석과 연결되어 있지 않다 - 화면/흐름 설계 확인용 목 데이터.
export function buildMockReport(groups: ParagraphGroup[], direction: Direction): MockReport {
  const sentences = groups.flatMap((g) => g.sentences);
  const points: MockPoint[] = sentences.slice(0, 3).map((sentence, i) => ({
    category: POINT_CATEGORIES[i % POINT_CATEGORIES.length],
    severity: SEVERITIES[i % SEVERITIES.length],
    sourceText: sentence.source,
    comment: "(목업) 실제 분석은 아직 연결되지 않았습니다. 화면 확인용 예시 코멘트입니다.",
  }));

  return {
    overallComment:
      "(목업) 전반적으로 자연스러운 번역입니다. 이 문구는 실제 AI 분석 결과가 아니라 화면 확인용 예시입니다.",
    strengths: sentences.length > 0 ? ["(목업) 문맥에 맞는 자연스러운 어휘 선택"] : [],
    points,
    levelLabel: LEVEL_LABEL[direction],
  };
}
