import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  metadataBase: new URL("https://svarg.net"),
  title: {
    default: "SVARG_NET — блог о технологиях",
    template: "%s | SVARG_NET",
  },
  description: "Технический блог о Go, Next.js, PostgreSQL и современной веб-разработке",
  keywords: ["Go", "Golang", "Next.js", "React", "PostgreSQL", "блог", "разработка"],
  authors: [{ name: "SVARG_NET" }],
  creator: "SVARG_NET",
  publisher: "SVARG_NET",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://svarg.net",
    siteName: "SVARG_NET",
    title: "SVARG_NET — блог о технологиях",
    description: "Технический блог о Go, Next.js, PostgreSQL и современной веб-разработке",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SVARG_NET",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SVARG_NET — блог о технологиях",
    description: "Технический блог о Go, Next.js, PostgreSQL и современной веб-разработке",
    images: ["/og-image.png"],
    creator: "@svarg_net",
  },
  alternates: {
    canonical: "https://svarg.net",
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div className="site-layout">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}