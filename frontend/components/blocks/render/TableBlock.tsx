import type { TableBlockData } from "@/lib/api/blocks";

export default function TableBlock({ data }: { data: TableBlockData }) {
  const rows = data.rows || [];
  if (rows.length === 0) return null;

  const [first, ...rest] = rows;
  const hasHeader = data.header ?? true;
  const body = hasHeader ? rest : rows;

  return (
    <div className="block block-table">
      <div className="block-table-wrap">
        <table>
          {hasHeader && (
            <thead>
              <tr>
                {first.map((cell, i) => (
                  <th key={i}>{cell}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
