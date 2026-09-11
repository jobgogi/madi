import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// 여러 훅이 각자 반복하던 "마운트(또는 deps 변경) 후 비동기 조회, 언마운트/재실행
// 시 오래된 결과 무시" 패턴을 공유. deps가 바뀌면 data를 null로 리셋하고 다시
// 로드한다 - id가 바뀌는 동안 이전 데이터가 잠깐 보이는 걸 막기 위함
// (useSessionFeedback처럼 deps가 있는 훅에서 특히 중요).
export function useAsyncData<T>(
  load: () => Promise<T>,
  deps: React.DependencyList,
): { data: T | null; setData: Dispatch<SetStateAction<T | null>>; loaded: boolean } {
  const [data, setData] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setLoaded(false);
    load().then((result) => {
      if (cancelled) return;
      setData(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loaded };
}
