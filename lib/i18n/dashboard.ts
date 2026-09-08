import type { NativeLanguage } from "@/lib/native-language";
import type { DirectionFilter } from "@/lib/hooks/useDashboardData";

interface DashboardText {
  title: string;
  subtitle: string;
  settingsLink: string;
  newSessionButton: string;
  directionFilterLabel: string;
  directionFilterOptionLabel: Record<DirectionFilter, string>;
  weekdayLabels: string[];
  monthLabel: (month: number) => string;
  activityHeading: string;
  activitySectionLabel: string;
  dayTitle: (date: string, count: number) => string;
  legendLow: string;
  legendHigh: string;
  categoriesHeading: string;
  categoriesSectionLabel: string;
  categoriesEmpty: string;
  categoryCount: (count: number) => string;
  categoryLinkLabel: (categoryLabel: string, count: number) => string;
  recentHeading: string;
  recentSectionLabel: string;
  recentEmpty: string;
  historyLink: string;
  loading: string;
}

export const dashboardText: Record<NativeLanguage, DashboardText> = {
  ko: {
    title: "마디 — 일한 번역 학습 도구",
    subtitle: "AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습",
    settingsLink: "설정",
    newSessionButton: "새 학습 시작",
    directionFilterLabel: "번역 방향 필터",
    directionFilterOptionLabel: {
      all: "전체",
      ja_to_ko: "日→韓",
      ko_to_ja: "韓→日",
    },
    weekdayLabels: ["", "월", "", "수", "", "금", ""],
    monthLabel: (month) => `${month}월`,
    activityHeading: "학습 활동",
    activitySectionLabel: "일별 학습 활동",
    dayTitle: (date, count) => `${date} · ${count}건`,
    legendLow: "적음",
    legendHigh: "많음",
    categoriesHeading: "자주 틀리는 카테고리",
    categoriesSectionLabel: "자주 틀리는 카테고리",
    categoriesEmpty: "아직 집계할 기록이 없습니다.",
    categoryCount: (count) => `${count}건`,
    categoryLinkLabel: (categoryLabel, count) => `${categoryLabel} ${count}건 — 해당 기록으로 이동`,
    recentHeading: "최근 기록",
    recentSectionLabel: "최근 기록",
    recentEmpty: "아직 저장된 분석 기록이 없습니다.",
    historyLink: "전체 기록 보기",
    loading: "불러오는 중...",
  },
  ja: {
    title: "마디（マディ）— 日韓翻訳学習ツール",
    subtitle: "AIが作った基準訳と自分の訳を比較しながら、一文ずつ確認する翻訳学習",
    settingsLink: "設定",
    newSessionButton: "新しい学習を始める",
    directionFilterLabel: "翻訳方向フィルター",
    directionFilterOptionLabel: {
      all: "すべて",
      ja_to_ko: "日→韓",
      ko_to_ja: "韓→日",
    },
    weekdayLabels: ["", "月", "", "水", "", "金", ""],
    monthLabel: (month) => `${month}月`,
    activityHeading: "学習アクティビティ",
    activitySectionLabel: "日別学習アクティビティ",
    dayTitle: (date, count) => `${date} · ${count}件`,
    legendLow: "少ない",
    legendHigh: "多い",
    categoriesHeading: "よく間違えるカテゴリー",
    categoriesSectionLabel: "よく間違えるカテゴリー",
    categoriesEmpty: "まだ集計できる記録がありません。",
    categoryCount: (count) => `${count}件`,
    categoryLinkLabel: (categoryLabel, count) => `${categoryLabel} ${count}件 — 該当の記録に移動`,
    recentHeading: "最近の記録",
    recentSectionLabel: "最近の記録",
    recentEmpty: "まだ保存された分析記録がありません。",
    historyLink: "すべての記録を見る",
    loading: "読み込み中...",
  },
};
