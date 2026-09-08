import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// 로그인이 필요한 화면(대시보드/기록/새 학습/설정/온보딩) 전체가 공유하는
// 인증 가드. 각 page.tsx마다 따로 체크하면 하나라도 빠뜨리기 쉬우므로
// (실제로 settings/onboarding에 빠져있었음) 라우트 그룹 레이아웃 하나로 통일한다.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return children;
}
