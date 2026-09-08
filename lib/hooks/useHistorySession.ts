import { useEffect, useState } from "react";
import { getSession, loadSessions, type HistorySession } from "@/lib/history";
import { findPreviousSession } from "@/lib/session-summary";

// 리포트 화면(app/history/[id])이 마운트 후 DB에서 세션과 비교 대상(직전
// 세션)을 한 번 읽어오는 로직 - fetch 접근이라 컴포넌트 밖으로 분리.
export function useHistorySession(id: string): {
  session: HistorySession | null | undefined;
  previous: HistorySession | null;
} {
  const [session, setSession] = useState<HistorySession | null | undefined>(undefined);
  const [previous, setPrevious] = useState<HistorySession | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(undefined);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrevious(null);

    (async () => {
      const loaded = await getSession(id);
      if (cancelled) return;
      setSession(loaded);
      if (loaded) {
        const all = await loadSessions();
        if (cancelled) return;
        setPrevious(findPreviousSession(all, loaded));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { session, previous };
}
