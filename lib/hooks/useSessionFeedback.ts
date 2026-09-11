import { getFeedback, setFeedback as saveFeedback, type Feedback } from "@/lib/session-feedback";
import { useAsyncData } from "./useAsyncData";

// 리포트 화면의 좋아요/싫어요 버튼 상태 - reportId가 정해지기 전(세션 로딩 중)엔
// 조회를 건너뛴다. 저장은 optimistic으로 즉시 반영하고 실패해도 롤백하지 않는다
// (부가 기능이라 실패 시 재시도/에러 UI까지는 과설계).
export function useSessionFeedback(reportId: string | null): {
  feedback: Feedback | null;
  setFeedback: (value: Feedback) => void;
} {
  const { data: feedback, setData: setFeedbackState } = useAsyncData(
    () => (reportId ? getFeedback(reportId) : Promise.resolve(null)),
    [reportId],
  );

  function setFeedback(value: Feedback): void {
    setFeedbackState(value);
    if (!reportId) return;
    saveFeedback(reportId, value);
  }

  return { feedback, setFeedback };
}
