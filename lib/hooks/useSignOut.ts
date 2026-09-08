import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearSettings } from "@/lib/settings";

// 설정 화면의 로그아웃 버튼용 - 세션 종료 후 랜딩 페이지로 이동.
// router.refresh()로 서버 컴포넌트(레이아웃 가드 등)가 갱신된 쿠키 상태를
// 즉시 다시 읽도록 한다. API 키(localStorage)도 함께 지운다 - 공용
// 컴퓨터에서 다음 계정으로 로그인한 사람이 이전 사용자의 키를 그대로
// 쓸 수 있으면 안 되기 때문.
export function useSignOut(): { signOut: () => Promise<void>; loading: boolean } {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut(): Promise<void> {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSettings();
    router.push("/");
    router.refresh();
  }

  return { signOut, loading };
}
