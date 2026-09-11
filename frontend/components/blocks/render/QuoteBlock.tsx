import type { QuoteBlockData } from "@/lib/api/blocks";

export default function QuoteBlock({ data }: { data: QuoteBlockData }) {
  if (!data.text) return null;
  return (
    <blockquote className="block block-quote">
      <p>{data.text}</p>
      {(data.author || data.source) && (
        <cite>
          {data.author}
          {data.author && data.source ? " · " : ""}
          {data.source}
        </cite>
      )}
    </blockquote>
  );
}
