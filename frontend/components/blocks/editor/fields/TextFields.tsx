"use client";

import PlateEditor from "@/components/PlateEditor";
import type { TextBlockData } from "@/lib/api/blocks";
import { emptyPlate } from "../constants";

type Props = {
  data: TextBlockData;
  onChange: (data: Record<string, unknown>) => void;
};

export default function TextFields({ data, onChange }: Props) {
  return (
    <div className="block-editor-field">
      <label>Текст</label>
      <PlateEditor
        initialValue={data.content_json || emptyPlate}
        onChange={(next) => onChange({ ...data, content_json: next })}
      />
    </div>
  );
}
