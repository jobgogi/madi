// 로컬(브라우저/서버 타임존 기준) 날짜를 "YYYY-MM-DD" 키로 - 잔디 그래프
// (dashboard-stats.ts)와 관리자 통계(admin-stats.ts)의 일별 집계가 공유한다.
export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
