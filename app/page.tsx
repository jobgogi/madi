import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditCompareIcon, LockIcon, ShieldBadgeIcon, TrendingUpIcon, WarningTriangleIcon } from "@/components/icons";

const FEATURES = [
  {
    Icon: EditCompareIcon,
    title: "문장 단위 정밀 비교",
    body: "원문을 자동으로 문장 단위로 나누고, AI 기준 번역과 내 번역을 색으로 대조해 어디가 다른지 한눈에 보여줘요.",
  },
  {
    Icon: WarningTriangleIcon,
    title: "뜻이 뒤바뀌는 실수부터 우선 확인",
    body: "부정어 누락처럼 의미가 반전되는 critical 오류를 가장 먼저 짚고, 조사·경어·어순·뉘앙스까지 10개 카테고리로 나눠 알려드려요.",
  },
  {
    Icon: ShieldBadgeIcon,
    title: "JLPT · TOPIK 레벨 자동 판정",
    body: "번역한 문장의 난이도를 자동으로 측정해, 내가 지금 어느 수준인지 문장마다 확인할 수 있어요.",
  },
  {
    Icon: TrendingUpIcon,
    title: "그래프로 보는 성장",
    body: "잔디 그래프로 학습 꾸준함을, 카테고리별 통계로 자주 틀리는 부분이 줄어드는지 눈으로 확인하세요.",
  },
  {
    Icon: LockIcon,
    title: "내 API 키로, 내 방식대로",
    body: "OpenAI · Claude · Gemini 중 원하는 AI를 선택하세요. API 키는 서버를 거치지 않고 이 브라우저에만 저장됩니다.",
  },
];

function GoogleCta() {
  return (
    <Link
      href="/signin"
      className="flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-7 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-700"
    >
      <img src="/google-icon.svg" alt="" className="h-[18px] w-[18px]" />
      Google로 시작하기
    </Link>
  );
}

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex-1 bg-zinc-50">
      <section className="flex flex-col items-center gap-5 px-4 pb-14 pt-16 text-center sm:pt-20">
        <span className="rounded-full bg-zinc-100 px-3.5 py-1 text-xs font-medium text-zinc-600">
          일본어를 배우는 한국인, 한국어를 배우는 일본인을 위한
        </span>
        <h1 className="max-w-xl text-3xl leading-snug font-bold text-zinc-900 sm:text-4xl">
          내 번역, <span className="text-teal-700">AI가 문장 하나하나</span> 짚어드립니다
        </h1>
        <p className="max-w-md text-base leading-relaxed text-zinc-600">
          AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습 — 마디
        </p>
        <div className="mt-2 flex flex-col items-center gap-2.5">
          <GoogleCta />
          <p className="text-xs text-zinc-400">무료로 시작 · 내 API 키는 이 브라우저에만 저장됩니다</p>
        </div>
      </section>

      <section className="flex justify-center px-4 pb-16">
        <div className="grid w-full max-w-4xl grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
          {FEATURES.map(({ Icon, title, body }) => (
            <div key={title} className="flex flex-col gap-2.5 rounded-lg border border-zinc-200 bg-white p-5">
              <Icon className="h-5 w-5 text-teal-700" />
              <p className="text-[15px] font-semibold text-zinc-900">{title}</p>
              <p className="text-[13.5px] leading-relaxed text-zinc-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 border-t border-zinc-200 px-4 py-14 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">지금 바로 한 문장부터 시작해보세요</h2>
        <GoogleCta />
      </section>
    </div>
  );
}
