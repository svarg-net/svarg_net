"use client";

import { useMemo, useState } from "react";
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
import { ImagePlugin } from "@platejs/media/react";
import {
  Plate,
  PlateContent,
  PlateElement,
  useEditorRef,
  usePlateEditor,
  type PlateElementProps,
} from "@platejs/core/react";
import type { PlateValue } from "@/lib/plate-types";
import MediaPicker from "./MediaPicker";

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
      ImagePlugin,
    ],
    []
  );

  const editor = usePlateEditor({
    plugins,
    value: initialValue,
    override: {
      components: {
        img: ImageElement,
      },
    },
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

function ImageElement(props: PlateElementProps) {
  const element = props.element as { url?: string; alt?: string };

  return (
    <PlateElement {...props}>
      <div contentEditable={false} style={{ margin: "12px 0" }}>
        <img
          src={element.url}
          alt={element.alt || ""}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "6px",
            display: "block",
          }}
        />
        {element.alt ? (
          <p
            style={{
              fontSize: "12px",
              color: "#666",
              textAlign: "center",
              margin: "4px 0 0",
            }}
          >
            {element.alt}
          </p>
        ) : null}
      </div>
    </PlateElement>
  );
}

function EditorToolbar() {
  const editor = useEditorRef();
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleInsertImage = (url: string, alt: string) => {
    editor.tf.focus();
    editor.tf.insertNodes({
      type: "img",
      url,
      alt,
      children: [{ text: "" }],
    });
    setShowMediaPicker(false);
  };

  return (
    <>
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
        <ToolbarButton label="B" onMouseDown={() => editor.tf.toggleMark("bold")} />
        <ToolbarButton label="I" onMouseDown={() => editor.tf.toggleMark("italic")} />
        <ToolbarButton label="U" onMouseDown={() => editor.tf.toggleMark("underline")} />
        <ToolbarButton label="S" onMouseDown={() => editor.tf.toggleMark("strikethrough")} />
        <ToolbarButton label="<>" onMouseDown={() => editor.tf.toggleMark("code")} />
        <span style={{ margin: "0 5px", color: "#ccc" }}>|</span>
        <ToolbarButton label="H1" onMouseDown={() => editor.tf.toggleBlock("h1")} />
        <ToolbarButton label="H2" onMouseDown={() => editor.tf.toggleBlock("h2")} />
        <ToolbarButton label="H3" onMouseDown={() => editor.tf.toggleBlock("h3")} />
        <span style={{ margin: "0 5px", color: "#ccc" }}>|</span>
        <ToolbarButton label="❝" onMouseDown={() => editor.tf.toggleBlock("blockquote")} />
        <ToolbarButton label="Code" onMouseDown={() => editor.tf.toggleBlock("code_block")} />
        <ToolbarButton
          label="🔗"
          onMouseDown={() => {
            const url = prompt("Введите URL:");
            if (url) {
              editor.tf.insertNodes({
                type: "a",
                url,
                children: [{ text: url }],
              });
            }
          }}
        />
        <span style={{ margin: "0 5px", color: "#ccc" }}>|</span>
        <ToolbarButton label="🖼️" onMouseDown={() => setShowMediaPicker(true)} />
      </div>

      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleInsertImage}
      />
    </>
  );
}

function ToolbarButton({
  label,
  onMouseDown,
}: {
  label: string;
  onMouseDown?: () => void;
}) {
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
        if (onMouseDown) onMouseDown();
      }}
    >
      {label}
    </button>
  );
}
