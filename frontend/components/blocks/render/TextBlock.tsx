import type { TextBlockData } from "@/lib/api/public/blocks";
import PlateRenderer from "@/components/site/PlateRenderer";

export default function TextBlock({ data }: { data: TextBlockData }) {
  if (!data.content_json || data.content_json.length === 0) return null;
  return (
    <div className="block block-text">
      <PlateRenderer content={data.content_json} />
    </div>
  );
}
