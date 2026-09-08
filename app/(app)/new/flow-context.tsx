"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { Direction } from "@/lib/analysis-schema";
import { directionForLanguage, loadNativeLanguage } from "@/lib/native-language";
import { splitIntoSentences } from "@/lib/sentence-split";

export interface SentenceEntry {
  source: string;
  translation: string;
}

export interface ParagraphGroup {
  paragraph: string;
  sentences: SentenceEntry[];
}

// 새 학습 흐름(원문 입력 → 번역 입력 → 분석/저장)이 여러 라우트에 걸쳐
// 공유하는 화면 전용 상태 - DB/localStorage 없이 메모리에만 존재하므로
// 새로고침하면 사라진다. 분석 결과는 화면 상태가 아니라 DB(reports
// 테이블)에 저장되고, 완료 즉시 /history/[id]로 이동하므로 여기서는
// 들고 있지 않는다.
interface FlowState {
  direction: Direction;
  setDirection: Dispatch<SetStateAction<Direction>>;
  paragraphs: string[];
  setParagraphs: Dispatch<SetStateAction<string[]>>;
  groups: ParagraphGroup[];
  setGroups: Dispatch<SetStateAction<ParagraphGroup[]>>;
}

const FlowContext = createContext<FlowState | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [direction, setDirection] = useState<Direction>("ja_to_ko");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [groups, setGroups] = useState<ParagraphGroup[]>([]);

  useEffect(() => {
    // 마운트 후 저장된 모국어 설정이 있으면 기본 학습 방향으로 반영 (SSR/hydration 안전).
    let cancelled = false;
    loadNativeLanguage().then((lang) => {
      if (!cancelled && lang) setDirection(directionForLanguage(lang));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <FlowContext.Provider value={{ direction, setDirection, paragraphs, setParagraphs, groups, setGroups }}>
      {children}
    </FlowContext.Provider>
  );
}

// 1단계(원문 입력)에서 확정한 문단들을 2단계(번역 입력)의 초기 상태로
// 변환한다 - 문단마다 문장 분리 후 빈 번역 슬롯을 채워둔다.
export function buildParagraphGroups(paragraphs: string[]): ParagraphGroup[] {
  return paragraphs.map((paragraph) => ({
    paragraph,
    sentences: splitIntoSentences(paragraph).map((source) => ({ source, translation: "" })),
  }));
}

export function useFlow(): FlowState {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
