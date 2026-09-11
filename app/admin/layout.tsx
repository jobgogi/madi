import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin/prompt-templates", label: "프롬프트 템플릿" },
  { href: "/admin/error-categories", label: "에러 카테고리" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/stats", label: "통계" },
];

// 관리자 전용 라우트 가드. app/(app)/layout.tsx의 로그인 체크 패턴에
// profiles.role 확인을 더한다 - 일반 사용자가 /admin/*에 접근하면 대시보드로 되돌림.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-zinc-900">관리자</h1>
          <nav className="flex flex-wrap gap-4 text-sm">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-zinc-600 hover:text-zinc-900 hover:underline">
                {item.label}
              </Link>
            ))}
            <Link href="/dashboard" className="text-zinc-400 hover:text-zinc-600 hover:underline">
              ← 서비스로
            </Link>
          </nav>
        </header>
        <main className="flex flex-col gap-8">{children}</main>
      </div>
    </div>
  );
}
