import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "마디 — 일한 번역 분석 도구",
  description: "일본어 원문과 한국어 번역을 AI로 비교 분석하는 학습 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
