"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminStats, type AdminStats } from "@/lib/api/stats";
import StatsChart from "@/components/StatsChart";
import "@/styles/stats.css";

const PERIODS = [
  { label: "7 дней", value: 7 },
  { label: "30 дней", value: 30 },
  { label: "90 дней", value: 90 },
];

export default function StatsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getAdminStats(days)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  const maxViews = data ? Math.max(...data.posts.map((p) => p.views), 1) : 1;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>📊 Статистика просмотров</h1>
        <div className="admin-nav">
          <Link href="/">На сайт</Link>
        </div>
      </div>

      <div className="stats-page">
        <div className="stats-toolbar">
          <Link href="/admin" className="stats-back-link">
            ← Назад к панели
          </Link>

          <div className="stats-period-switcher">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                className={days === p.value ? "active" : ""}
                onClick={() => setDays(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="error-message">Ошибка: {error}</div>}
        {loading && !data && <p>Загрузка...</p>}

        {data && (
          <>
            <div className="stats-summary">
              <div className="stats-card">
                <div className="stats-card-label">Всего просмотров</div>
                <div className="stats-card-value">
                  {data.summary.total_views}
                </div>
                <div className="stats-card-sub">
                  {data.summary.total_unique} уникальных посетителей
                </div>
              </div>
              <div className="stats-card">
                <div className="stats-card-label">Сегодня</div>
                <div className="stats-card-value">
                  {data.summary.views_today}
                </div>
                <div className="stats-card-sub">
                  {data.summary.unique_today} уникальных
                </div>
              </div>
              <div className="stats-card">
                <div className="stats-card-label">Среднее в день</div>
                <div className="stats-card-value">
                  {data.daily.length > 0
                    ? Math.round(
                        data.summary.total_views / Math.max(data.daily.length, 1)
                      )
                    : 0}
                </div>
                <div className="stats-card-sub">за период {days} дн.</div>
              </div>
              <div className="stats-card">
                <div className="stats-card-label">Постов с просмотрами</div>
                <div className="stats-card-value">{data.posts.length}</div>
                <div className="stats-card-sub">за всё время</div>
              </div>
            </div>

            <div className="stats-chart-wrapper">
              <h3 className="stats-chart-title">Просмотры по дням</h3>
              <div className="stats-chart-legend">
                <span>
                  <span
                    className="stats-legend-dot"
                    style={{ background: "#4a90e2" }}
                  />
                  Всего просмотров
                </span>
                <span>
                  <span
                    className="stats-legend-dot"
                    style={{ background: "#27ae60" }}
                  />
                  Уникальных
                </span>
              </div>
              <StatsChart data={data.daily} />
            </div>

            <div className="stats-table-wrapper">
              {data.posts.length === 0 ? (
                <div className="stats-empty">
                  Пока нет просмотров. Открой пару постов на сайте 🚀
                </div>
              ) : (
                <table className="stats-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Пост</th>
                      <th className="num">Просмотров</th>
                      <th className="num">Уникальных</th>
                      <th>Доля</th>
                      <th>Последний просмотр</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.posts.map((p, i) => (
                      <tr key={p.id}>
                        <td>{i + 1}</td>
                        <td>
                          <Link
                            href={`/posts/${p.slug}`}
                            target="_blank"
                            style={{ color: "#111", textDecoration: "none" }}
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="num">{p.views}</td>
                        <td className="num">{p.unique}</td>
                        <td>
                          <div className="stats-bar">
                            <div
                              className="stats-bar-inner"
                              style={{
                                width: `${(p.views / maxViews) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                        <td>
                          {p.last_view_at
                            ? new Date(p.last_view_at).toLocaleString(
                                "ru-RU",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
