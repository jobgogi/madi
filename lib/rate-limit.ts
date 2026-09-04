// 서버 인스턴스 메모리에만 저장되는 간단한 슬라이딩 윈도우 리미터.
// 서버리스 환경(Cloudflare Workers 등)에서는 인스턴스마다 별도로 카운트되고
// 콜드 스타트 시 초기화되므로 "최선 노력" 수준의 방어이지, 엄격한 보장은 아니다.
const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  hits.set(key, timestamps);
  return timestamps.length > maxRequests;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
