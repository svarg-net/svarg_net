"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPopularPosts, type PopularPost } from "@/lib/api/stats";

export default function PopularPosts() {
  const [posts, setPosts] = useState<PopularPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPopularPosts(5)
      .then((items) => {
        if (!cancelled) {
          setPosts(items ?? []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <aside
      style={{
        border: "1px solid #eee",
        borderRadius: "8px",
        padding: "18px 20px",
        background: "#fafafa",
        marginTop: "24px",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "16px" }}>🔥 Популярное</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {posts.map((p) => (
          <li key={p.id} style={{ marginBottom: "10px" }}>
            <Link
              href={`/posts/${p.slug}`}
              style={{
                textDecoration: "none",
                color: "#111",
                fontSize: "14px",
                lineHeight: "1.4",
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <span>{p.title}</span>
              <span style={{ color: "#888", fontSize: "12px", flexShrink: 0 }}>
                👁 {p.views}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
