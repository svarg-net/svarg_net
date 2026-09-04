import type { Metadata } from "next";
import NotFoundTerminal from "@/components/NotFoundTerminal";

export const metadata: Metadata = {
  title: "404 — страница не найдена",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundTerminal />;
}
