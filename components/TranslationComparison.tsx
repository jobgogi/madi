import { diffChars } from "@/lib/diff";

// base(내 번역 등)와 alternative(AI 제안 등)를 문자 단위로 비교해서, 서로
// 다른 부분만 색으로 강조한 두 줄로 보여준다.
export function TranslationComparison({
  baseLabel = "내 번역",
  base,
  altLabel = "AI 제안",
  alternative,
}: {
  baseLabel?: string;
  base: string;
  altLabel?: string;
  alternative: string;
}) {
  const ops = diffChars(base, alternative);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm leading-relaxed">
        <span className="mr-1.5 shrink-0 text-xs font-medium text-zinc-400">
          {baseLabel}
        </span>
        {ops
          .filter((op) => op.type !== "add")
          .map((op, i) =>
            op.type === "remove" ? (
              <span
                key={i}
                className="rounded bg-red-100 text-red-700 line-through"
              >
                {op.text}
              </span>
            ) : (
              <span key={i} className="text-zinc-800">
                {op.text}
              </span>
            ),
          )}
      </p>
      <p className="text-sm leading-relaxed">
        <span className="mr-1.5 shrink-0 text-xs font-medium text-zinc-400">
          {altLabel}
        </span>
        {ops
          .filter((op) => op.type !== "remove")
          .map((op, i) =>
            op.type === "add" ? (
              <span
                key={i}
                className="rounded bg-emerald-100 font-medium text-emerald-800"
              >
                {op.text}
              </span>
            ) : (
              <span key={i} className="text-zinc-800">
                {op.text}
              </span>
            ),
          )}
      </p>
    </div>
  );
}
