import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PET HOT - 宠业动态聚合",
  description: "参考 AI HOT 的宠物行业信息站，聚合精选、全部宠业动态和 AI 日报。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
