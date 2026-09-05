"use client";

import { useEffect, useState } from "react";
import { recordPostView } from "@/lib/api/stats";

type Props = {
  slug: string;
  initialViews: number;
};

export default function PostViewCounter({ slug, initialViews }: Props) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    const key = `viewed:${slug}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      return;
    }

    let cancelled = false;
    recordPostView(slug)
      .then((v) => {
        if (!cancelled) {
          setViews(v);
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            // storage может быть недоступен (privacy mode)
          }
        }
      })
      .catch(() => {
        /* тихо */
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <span
      aria-label={`Просмотров: ${views}`}
      style={{ color: "#666", fontSize: "14px" }}
    >
      👁 {views}
    </span>
  );
}
