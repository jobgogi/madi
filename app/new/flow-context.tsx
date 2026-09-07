"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Direction } from "@/lib/analysis-schema";
import type { MockReport } from "./mock-report";

export interface SentenceEntry {
  source: string;
  translation: string;
}

export interface ParagraphGroup {
  paragraph: string;
  sentences: SentenceEntry[];
}

// 새 학습 흐름(원문 입력 → 번역 입력 → 리포트)이 여러 라우트에 걸쳐
// 공유하는 화면 전용 상태 - DB/localStorage 없이 메모리에만 존재하므로
// 새로고침하면 사라진다 (이 단계는 화면 설계 확인용).
interface FlowState {
  direction: Direction;
  setDirection: Dispatch<SetStateAction<Direction>>;
  paragraphs: string[];
  setParagraphs: Dispatch<SetStateAction<string[]>>;
  groups: ParagraphGroup[];
  setGroups: Dispatch<SetStateAction<ParagraphGroup[]>>;
  report: MockReport | null;
  setReport: Dispatch<SetStateAction<MockReport | null>>;
}

const FlowContext = createContext<FlowState | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<Direction>("ja_to_ko");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [groups, setGroups] = useState<ParagraphGroup[]>([]);
  const [report, setReport] = useState<MockReport | null>(null);

  return (
    <FlowContext.Provider
      value={{ direction, setDirection, paragraphs, setParagraphs, groups, setGroups, report, setReport }}
    >
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow(): FlowState {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
