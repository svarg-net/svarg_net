"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard недоступен */
    }
  };

  return (
    <button
      type="button"
      className="block-code-copy"
      onClick={handleCopy}
      title="Скопировать код"
    >
      {copied ? "✓ Скопировано" : "Копировать"}
    </button>
  );
}
