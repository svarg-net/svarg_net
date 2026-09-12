"use client";

import { useState } from "react";
import type { TabsBlockData } from "@/lib/api/blocks";
import PlateRenderer from "@/components/PlateRenderer";

export default function TabsBlock({ data }: { data: TabsBlockData }) {
  const items = data.items || [];
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;
  const safe = Math.min(active, items.length - 1);

  return (
    <div className="block block-tabs">
      <div className="block-tabs-head" role="tablist">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={safe === i}
            className={"block-tabs-tab" + (safe === i ? " is-active" : "")}
            onClick={() => setActive(i)}
          >
            {item.title || `Вкладка ${i + 1}`}
          </button>
        ))}
      </div>
      <div className="block-tabs-panel">
        {items[safe].content_json && (
          <PlateRenderer
            key={safe}
            content={items[safe].content_json}
          />
        )}
      </div>
    </div>
  );
}
