import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  baseUrl: string;
};

export default function Pagination({ page, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const hrefFor = (p: number): string =>
    p === 1 ? baseUrl : `${baseUrl}?page=${p}`;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const navStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    justifyContent: "center",
    margin: "40px 0 20px",
    flexWrap: "wrap",
  } as const;

  const linkStyle = (active: boolean) => ({
    padding: "6px 12px",
    border: "1px solid " + (active ? "#111" : "#ddd"),
    borderRadius: "6px",
    background: active ? "#111" : "#fff",
    color: active ? "#fff" : "#333",
    textDecoration: "none",
    fontSize: "14px",
  });

  return (
    <nav style={navStyle} aria-label="Пагинация">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} style={linkStyle(false)}>
          ← Назад
        </Link>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          style={linkStyle(p === page)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </Link>
      ))}

      {page < totalPages && (
        <Link href={hrefFor(page + 1)} style={linkStyle(false)}>
          Вперёд →
        </Link>
      )}
    </nav>
  );
}
