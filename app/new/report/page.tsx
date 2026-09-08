"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_LABEL } from "@/lib/dashboard-stats";
import { SEVERITY_LABEL, SEVERITY_STYLE } from "@/lib/severity-style";
import { StarIcon, WarningTriangleIcon } from "@/components/icons";
import { useFlow } from "../flow-context";

export default function NewFlowReportPage() {
  const router = useRouter();
  const { report, groups } = useFlow();

  useEffect(() => {
    if (!report) router.replace("/new");
  }, [report, router]);

  if (!report) return null;

  const fullSourceText = groups.map((g) => g.paragraph).join(" ");

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">통합 리포트</h1>
          <p className="mt-1 text-xs text-zinc-400">
            화면/흐름 확인용 목업 데이터입니다. 실제 AI 분석과는 연결되어 있지 않습니다.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          {report.levelLabel}
        </span>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">전체 원문</h2>
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm leading-relaxed text-zinc-800">
          {fullSourceText}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">총평</h2>
        <p className="text-sm text-zinc-700">{report.overallComment}</p>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
          <StarIcon className="h-4 w-4" /> 가장 잘한 점
        </h2>
        {report.strengths.length === 0 ? (
          <p className="text-sm text-zinc-500">이번엔 특별히 강조할 점을 찾지 못했습니다.</p>
        ) : (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 p-3">
            <ul className="flex flex-col gap-2">
              {report.strengths.map((text, i) => (
                <li key={i} className="text-sm text-emerald-800">
                  {text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-red-300 bg-red-50/40 p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
          <WarningTriangleIcon className="h-4 w-4" /> 아쉬운 점
        </h2>
        {report.points.length === 0 ? (
          <p className="text-sm text-zinc-500">특별히 짚을 만한 지적 사항이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {report.points.map((point, i) => (
              <li key={i} className="rounded-lg border border-zinc-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-zinc-900 px-2.5 py-0.5 text-xs font-medium text-white">
                    {CATEGORY_LABEL[point.category]}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[point.severity]}`}
                  >
                    {SEVERITY_LABEL[point.severity]}
                  </span>
                </div>
                <p className="text-sm text-zinc-700">{point.sourceText}</p>
                <p className="mt-2 text-sm text-zinc-600">{point.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        aria-label="저장하고 대시보드로 이동"
        className="self-start rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
      >
        저장
      </button>
    </>
  );
}
