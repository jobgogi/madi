import type { Dispatch, SetStateAction } from "react";
import { loadSessions, type HistorySession } from "@/lib/history";
import { useAsyncData } from "./useAsyncData";

// 대시보드/전체 기록 페이지가 공유하는 "마운트 후 DB에서 세션 목록을 한 번
// 읽기" 훅. setter도 함께 반환해 삭제 등 로컬 갱신이 필요한 쪽에서 쓸 수
// 있게 한다.
export function useSessions(): [
  HistorySession[] | null,
  Dispatch<SetStateAction<HistorySession[] | null>>,
] {
  const { data, setData } = useAsyncData(loadSessions, []);
  return [data, setData];
}
