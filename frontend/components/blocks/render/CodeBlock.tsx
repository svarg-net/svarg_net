import type { CodeBlockData } from "@/lib/api/blocks";
import CopyButton from "@/components/blocks/CopyButton";

export default function CodeBlock({ data }: { data: CodeBlockData }) {
  const code = data.code || "";
  return (
    <div className="block block-code">
      <div className="block-code-header">
        <span className="block-code-lang">
          {data.filename || data.language || "code"}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="block-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
