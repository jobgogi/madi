import { createClient } from "@/lib/supabase/server";
import { DIRECTIONS, type Direction } from "@/lib/analysis-schema";
import type { Provider } from "@/lib/settings";
import { countByDirection, countByProvider, signupsByDay } from "@/lib/admin-stats";

const DIRECTION_LABEL: Record<Direction, string> = { ja_to_ko: "日→韓", ko_to_ja: "韓→日" };
const PROVIDERS: Provider[] = ["claude", "openai", "gemini"];
const PROVIDER_LABEL: Record<Provider, string> = { claude: "Claude", openai: "OpenAI", gemini: "Gemini" };
const SIGNUP_TREND_DAYS = 10;

function formatMonthDay(isoDate: string): string {
  // "YYYY-MM-DD" -> "MM/DD"
  return isoDate.slice(5).replace("-", "/");
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value.toLocaleString()}</p>
    </div>
  );
}

export default async function AdminStatsPage() {
  const supabase = await createClient();
  const [profilesRes, reportsRes] = await Promise.all([
    supabase.from("profiles").select("created_at"),
    supabase.from("reports").select("direction, provider"),
  ]);

  const profiles = profilesRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const directionCounts = countByDirection(reports);
  const providerCounts = countByProvider(reports);
  const trend = signupsByDay(
    profiles.map((p) => p.created_at),
    SIGNUP_TREND_DAYS,
  );
  const maxTrend = Math.max(1, ...trend.map((d) => d.count));

  return (
    <div className="flex flex-col gap-8">
      {(profilesRes.error || reportsRes.error) && (
        <p className="text-sm text-red-600">통계를 불러오는 중 일부 오류가 발생했습니다.</p>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="전체 가입자" value={profiles.length} />
        <MetricCard label="전체 리포트" value={reports.length} />
        {DIRECTIONS.map((direction) => (
          <MetricCard key={direction} label={`리포트 · ${DIRECTION_LABEL[direction]}`} value={directionCounts[direction]} />
        ))}
        {PROVIDERS.map((provider) => (
          <MetricCard key={provider} label={`리포트 · ${PROVIDER_LABEL[provider]}`} value={providerCounts[provider]} />
        ))}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium text-zinc-700">최근 {SIGNUP_TREND_DAYS}일 신규 가입</h2>
        <div className="mt-4 flex h-24 items-end gap-1">
          {trend.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count}명`}
              className="flex-1 rounded-t bg-teal-400"
              style={{ height: `${(day.count / maxTrend) * 100}%`, minHeight: day.count > 0 ? "4px" : "1px" }}
            />
          ))}
        </div>
        {trend.length > 0 && (
          <div className="mt-1 flex justify-between text-xs text-zinc-400">
            <span>{formatMonthDay(trend[0].date)}</span>
            <span>{formatMonthDay(trend[trend.length - 1].date)}</span>
          </div>
        )}
      </section>
    </div>
  );
}
