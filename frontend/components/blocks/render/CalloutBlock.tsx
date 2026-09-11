import type { CalloutBlockData } from "@/lib/api/blocks";

const icons: Record<string, string> = {
  info: "ℹ️",
  warning: "⚠️",
  error: "⛔",
  success: "✅",
};

export default function CalloutBlock({ data }: { data: CalloutBlockData }) {
  const type = data.type || "info";
  return (
    <div className={`block block-callout block-callout--${type}`}>
      <div className="block-callout-head">
        <span className="block-callout-icon">{icons[type] || "ℹ️"}</span>
        {data.title && <strong>{data.title}</strong>}
      </div>
      {data.text && <div className="block-callout-text">{data.text}</div>}
    </div>
  );
}
