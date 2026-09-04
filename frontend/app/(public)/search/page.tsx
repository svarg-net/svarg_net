"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import { searchPosts, type Post } from "@/lib/api/search";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Подсветка совпадений запроса в тексте
 */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (!text || words.length === 0) {
    return <>{text}</>;
  }

  const regex = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        words.includes(part.toLowerCase()) ? (
          <mark
            key={i}
            style={{
              background: "#ffe58a",
              padding: "0 2px",
              borderRadius: "2px",
            }}
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    searchPosts(query)
      .then((res) => {
        if (!cancelled) {
          setPosts(res.items ?? []);
          setSearched(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError((err as Error).message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div
      className="container"
      style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}
    >
      <h1>Поиск по сайту</h1>
      <SearchBar initialValue={query} />

      {error && (
        <div className="error-message" style={{ marginTop: "20px" }}>
          {error}
        </div>
      )}

      {loading && <p style={{ marginTop: "20px" }}>Ищем...</p>}

      {!loading && searched && (
        <>
          <p style={{ marginTop: "20px", color: "#666" }}>
            По запросу «{query}» найдено: {posts.length}
          </p>

          {posts.length === 0 ? (
            <p style={{ marginTop: "20px" }}>
              Ничего не найдено. Попробуйте другой запрос или более короткое
              слово.
            </p>
          ) : (
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {posts.map((post) => (
                <article
                  key={post.id}
                  style={{
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "20px",
                    background: "#fff",
                  }}
                >
                  <h2 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
                    <Link
                      href={`/posts/${post.slug}`}
                      style={{ textDecoration: "none", color: "#111" }}
                    >
                      <Highlight text={post.title} query={query} />
                    </Link>
                  </h2>
                  {post.excerpt && (
                    <p style={{ margin: "0 0 10px 0", color: "#444" }}>
                      <Highlight text={post.excerpt} query={query} />
                    </p>
                  )}
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#888",
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <time>
                      {new Date(
                        post.published_at || post.created_at
                      ).toLocaleDateString("ru-RU")}
                    </time>
                    {post.tags?.map((tag) => (
                      <span key={tag.id}>#{tag.name}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "40px 20px" }}>
          Загрузка...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
