"use client";

import type { DailyStats } from "@/lib/api/stats";


type Props = {
  data: DailyStats[];
};

/**
 * Простой SVG-график просмотров по дням.
 * Две линии: всего просмотров (синяя) и уникальных (зелёная).
 */
export default function StatsChart({ data }: Props) {
  if (!data || data.length === 0) {
    return <div className="stats-chart-empty">Нет данных за выбранный период</div>;
  }

  const width = 900;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const maxUnique = Math.max(...data.map((d) => d.unique), 1);
  const maxY = Math.max(maxViews, maxUnique);

  const x = (i: number) =>
    padding.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);
  const y = (v: number) => padding.top + chartH - (v / maxY) * chartH;

  const viewsPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.views)}`).join(" ");
  const uniquePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.unique)}`).join(" ");

  const yTicks = 4;
  const yGridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = (maxY / yTicks) * i;
    return { value: Math.round(v), y: y(v) };
  });

  // Показываем не все метки X, чтобы не переполнить
  const showXLabel = (i: number) => {
    if (data.length <= 7) return true;
    if (data.length <= 14) return i % 2 === 0;
    if (data.length <= 30) return i % 5 === 0;
    return i % 10 === 0;
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="stats-chart-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Сетка по Y */}
      {yGridLines.map((t) => (
        <g key={t.value}>
          <line
            className="grid-line"
            x1={padding.left}
            x2={width - padding.right}
            y1={t.y}
            y2={t.y}
          />
          <text
            className="grid-label"
            x={padding.left - 8}
            y={t.y + 4}
            textAnchor="end"
          >
            {t.value}
          </text>
        </g>
      ))}

      {/* Линии */}
      <path className="line-views" d={viewsPath} />
      <path className="line-unique" d={uniquePath} />

      {/* Точки с tooltip */}
      {data.map((d, i) => (
        <g key={i} className="point-group">
          <circle className="dot-views" cx={x(i)} cy={y(d.views)} r="3">
            <title>{d.date}: {d.views} просмотров</title>
          </circle>
          <circle className="dot-unique" cx={x(i)} cy={y(d.unique)} r="3">
            <title>{d.date}: {d.unique} уникальных</title>
          </circle>
        </g>
      ))}

      {/* Метки X */}
      {data.map((d, i) =>
        showXLabel(i) ? (
          <text
            key={`label-${i}`}
            className="x-label"
            x={x(i)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
          >
            {fmtDate(d.date)}
          </text>
        ) : null
      )}
    </svg>
  );
}

function fmtDate(iso: string): string {
  // "2026-09-05" → "05.09"
  const [, m, d] = iso.split("-");
  return `${d}.${m}`;
}
