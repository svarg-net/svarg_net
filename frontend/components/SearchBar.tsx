"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type SearchBarProps = {
  initialValue?: string;
};

export default function SearchBar({ initialValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      style={{ display: "flex", gap: "8px", marginTop: "20px" }}
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Поиск по статьям..."
        aria-label="Поиск по статьям"
        style={{
          flex: 1,
          padding: "10px 14px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "15px",
        }}
      />
      <button type="submit" className="btn btn-primary">
        Найти
      </button>
    </form>
  );
}
