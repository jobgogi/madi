import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마디 — 일한 번역 학습 도구",
  description: "AI가 만든 기준 번역과 내 번역을 비교하며, 한 문장씩 짚어가는 번역 학습",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
