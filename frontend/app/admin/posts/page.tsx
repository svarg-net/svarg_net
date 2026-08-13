"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPosts, deletePost, type Post } from "@/lib/api";
import { getToken, isAuthenticated } from "@/lib/auth";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/admin/login");
      return;
    }

    loadPosts();
  }, [router]);

  const loadPosts = async () => {
    try {
      // Получаем все посты (без фильтра по статусу)
      const response = await getPosts("", 1, 100);
      setPosts(response.items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этот пост?")) {
      return;
    }

    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      await deletePost(token, id);
      await loadPosts();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Управление постами</h1>
        <div className="admin-nav">
          <Link href="/">На сайт</Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Выйти
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div style={{ marginBottom: "20px" }}>
        <Link href="/admin/posts/new" className="btn btn-primary">
          + Новый пост
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <p>Нет постов</p>
        </div>
      ) : (
        <table className="posts-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Заголовок</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.title}</td>
                <td>
                  <span className={`status-badge status-${post.status}`}>
                    {post.status}
                  </span>
                </td>
                <td>{formatDate(post.created_at)}</td>
                <td>
                  <div className="actions">
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="btn btn-secondary"
                    >
                      Изменить
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="btn btn-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}