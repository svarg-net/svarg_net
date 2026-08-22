"use client";

import { useMemo } from "react";
import {
  BaseBlockquotePlugin,
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes";
import { ListPlugin } from "@platejs/list/react";
import { LinkPlugin } from "@platejs/link/react";
import { CodeBlockPlugin } from "@platejs/code-block/react";
import {
  Plate,
  PlateContent,
  usePlateEditor,
} from "@platejs/core/react";
import type { PlateValue } from "@/lib/plate-types";

type PlateEditorProps = {
  initialValue: PlateValue;
  onChange: (_value: PlateValue) => void;
  readOnly?: boolean;
};

export default function PlateEditor({
  initialValue,
  onChange,
  readOnly = false,
}: PlateEditorProps) {
  const plugins = useMemo(
    () => [
      BaseBoldPlugin,
      BaseItalicPlugin,
      BaseUnderlinePlugin,
      BaseStrikethroughPlugin,
      BaseCodePlugin,
      BaseH1Plugin,
      BaseH2Plugin,
      BaseH3Plugin,
      BaseBlockquotePlugin,
      ListPlugin,
      LinkPlugin,
      CodeBlockPlugin,
    ],
    []
  );

  const editor = usePlateEditor({
    plugins,
    value: initialValue,
  });

  return (
    <Plate
      editor={editor}
      onChange={(changeEvent) => {
        if (!readOnly && onChange) {
          onChange(changeEvent.value);
        }
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "6px",
          minHeight: readOnly ? "auto" : "400px",
          background: "white",
        }}
      >
        {!readOnly && <EditorToolbar />}
        <PlateContent
          style={{
            padding: "20px",
            minHeight: readOnly ? "auto" : "350px",
            outline: "none",
          }}
        />
      </div>
    </Plate>
  );
}

function EditorToolbar() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "5px",
        padding: "10px",
        borderBottom: "1px solid #eee",
        background: "#f9f9f9",
        borderRadius: "6px 6px 0 0",
      }}
    >
      <ToolbarButton label="B" />
      <ToolbarButton label="I" />
      <ToolbarButton label="U" />
      <ToolbarButton label="S" />
      <ToolbarButton label="<>" />
      <span style={{ margin: "0 5px", color: "#ccc" }}>|</span>
      <ToolbarButton label="H1" />
      <ToolbarButton label="H2" />
      <ToolbarButton label="H3" />
      <span style={{ margin: "0 5px", color: "#ccc" }}>|</span>
      <ToolbarButton label="❝" />
      <ToolbarButton label="Code" />
      <ToolbarButton label="🔗" />
    </div>
  );
}

function ToolbarButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      style={{
        padding: "5px 10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        background: "white",
        cursor: "pointer",
        fontSize: "14px",
      }}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}