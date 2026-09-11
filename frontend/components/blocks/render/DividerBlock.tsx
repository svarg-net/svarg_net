import type { DividerBlockData } from "@/lib/api/blocks";

export default function DividerBlock({ data }: { data: DividerBlockData }) {
  const style = data.style || "line";
  if (style === "space") {
    return <div className="block block-divider block-divider--space" />;
  }
  if (style === "dots") {
    return <div className="block block-divider block-divider--dots">• • •</div>;
  }
  return <hr className="block block-divider block-divider--line" />;
}
