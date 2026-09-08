import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 설정 화면의 로그아웃 버튼용 - 세션 종료 후 랜딩 페이지로 이동.
// router.refresh()로 서버 컴포넌트(레이아웃 가드 등)가 갱신된 쿠키 상태를
// 즉시 다시 읽도록 한다.
export function useSignOut(): { signOut: () => Promise<void>; loading: boolean } {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut(): Promise<void> {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return { signOut, loading };
}
