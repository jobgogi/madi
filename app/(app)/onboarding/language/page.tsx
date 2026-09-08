"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNativeLanguage } from "@/lib/hooks/useNativeLanguage";
import { detectBrowserLanguage, type NativeLanguage } from "@/lib/native-language";

const OPTIONS: { value: NativeLanguage; label: string; description: string }[] = [
  { value: "ko", label: "한국어", description: "일본어 문장을 한국어로 번역하며 학습해요" },
  { value: "ja", label: "日本語", description: "韓国語の文章を日本語に翻訳しながら学習します" },
];

export default function LanguageSelectPage() {
  const router = useRouter();
  const { language, setLanguage } = useNativeLanguage();
  const [selected, setSelected] = useState<NativeLanguage>(language ?? "ko");

  // 마운트 후 브라우저 언어 설정을 기본 선택값으로 반영 (SSR과 다를 수
  // 있어 렌더 중이 아니라 effect에서 갱신 - hydration 안전).
  useEffect(() => {
    setSelected(detectBrowserLanguage());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await setLanguage(selected);
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-7 rounded-lg border border-zinc-200 bg-white p-8"
      >
        <div className="text-center">
          <h1 className="text-xl font-semibold text-zinc-900">마디에 오신 것을 환영합니다</h1>
          <p className="mt-2 text-sm text-zinc-500">학습을 시작하기 전에, 사용하시는 언어를 선택해주세요.</p>
          <p className="mt-0.5 text-[13px] text-zinc-400">学習を始める前に、使用する言語を選択してください。</p>
        </div>

        <div role="radiogroup" aria-label="사용 언어 선택" className="flex flex-col gap-2.5">
          {OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
                selected === opt.value ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <input
                type="radio"
                name="native-language"
                value={opt.value}
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
                className="mt-1"
              />
              <div>
                <p className="text-[15px] font-semibold text-zinc-900">{opt.label}</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
        >
          시작하기
        </button>
      </form>
    </div>
  );
}
