"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/hooks/useLocale";
import { newFlow } from "@/lib/i18n/new";
import { FlowProvider } from "./flow-context";

function StepProgress() {
  const pathname = usePathname();
  const t = newFlow[useLocale()];
  const STEPS = [
    { href: "/new", label: t.stepSource },
    { href: "/new/translate", label: t.stepTranslate },
  ];
  const currentIndex = STEPS.findIndex((step) => step.href === pathname);

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label={t.stepAria}>
      {STEPS.map((step, i) => (
        <li key={step.href} className="flex items-center gap-2">
          <span
            aria-current={i === currentIndex ? "step" : undefined}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
              i === currentIndex
                ? "bg-zinc-900 text-white"
                : i < currentIndex
                  ? "bg-zinc-300 text-zinc-700"
                  : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {i + 1}
          </span>
          <span className={i === currentIndex ? "font-medium text-zinc-900" : "text-zinc-500"}>{step.label}</span>
          {i < STEPS.length - 1 && (
            <span aria-hidden className="text-zinc-300">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function NewFlowLayout({ children }: { children: React.ReactNode }) {
  const t = newFlow[useLocale()];
  return (
    <FlowProvider>
      <div className="flex flex-1 justify-center bg-zinc-50 px-4 py-10">
        <main className="flex w-full max-w-3xl flex-col gap-6">
          <Link href="/dashboard" className="self-start text-sm text-zinc-600 hover:text-zinc-900 hover:underline">
            {t.backToDashboard}
          </Link>
          <StepProgress />
          {children}
        </main>
      </div>
    </FlowProvider>
  );
}
