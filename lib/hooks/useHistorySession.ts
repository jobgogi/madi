import { useEffect, useState } from "react";
import { getSession, loadSessions, type HistorySession } from "@/lib/history";
import { findPreviousSession } from "@/lib/session-summary";

// 리포트 화면(app/history/[id])이 마운트 후 localStorage에서 세션과 비교
// 대상(직전 세션)을 한 번 읽어오는 로직 - fetch/storage 접근이라 컴포넌트
// 밖으로 분리.
export function useHistorySession(id: string): {
  session: HistorySession | null | undefined;
  previous: HistorySession | null;
} {
  const [session, setSession] = useState<HistorySession | null | undefined>(undefined);
  const [previous, setPrevious] = useState<HistorySession | null>(null);

  useEffect(() => {
    const loaded = getSession(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(loaded);
    if (loaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevious(findPreviousSession(loadSessions(), loaded));
    }
  }, [id]);

  return { session, previous };
}
