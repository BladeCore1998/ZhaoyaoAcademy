import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "招摇书院",
  description: "招摇夭夭的歌单、书单与棉花糖信箱。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
