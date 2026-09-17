"use client";

import type { TableBlockData } from "@/lib/api/public/blocks";

type Props = {
  data: TableBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

export default function TableFields({ data, onChange }: Props) {
  const rows = data.rows && data.rows.length > 0 ? data.rows : [["", ""]];
  const cols = rows[0]?.length || 2;

  const setRows = (next: string[][]) => onChange({ ...data, rows: next });

  const setCell = (r: number, c: number, value: string) => {
    setRows(
      rows.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? value : cell)) : row
      )
    );
  };

  const addRow = () => setRows([...rows, Array(cols).fill("")]);
  const removeRow = () => rows.length > 1 && setRows(rows.slice(0, -1));
  const addCol = () => setRows(rows.map((row) => [...row, ""]));
  const removeCol = () =>
    cols > 1 && setRows(rows.map((row) => row.slice(0, -1)));

  return (
    <>
      <div className="block-editor-field">
        <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={data.header ?? true}
            onChange={(e) => onChange({ ...data, header: e.target.checked })}
          />
          Первая строка — заголовок
        </label>
      </div>

      <div className="block-editor-field">
        <label>
          Таблица ({rows.length} × {cols})
        </label>
        <div className="table-editor">
          {rows.map((row, r) => (
            <div key={r} className="table-editor-row">
              {row.map((cell, c) => (
                <input
                  key={c}
                  value={cell}
                  placeholder={`R${r + 1}C${c + 1}`}
                  onChange={(e) => setCell(r, c, e.target.value)}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="table-editor-actions">
          <button type="button" onClick={addRow}>+ строка</button>
          <button type="button" onClick={removeRow}>− строка</button>
          <button type="button" onClick={addCol}>+ колонка</button>
          <button type="button" onClick={removeCol}>− колонка</button>
        </div>
      </div>
    </>
  );
}
