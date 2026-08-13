import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "SVARG_NET — блог",
  description: "Блог проекта svarg_net",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}