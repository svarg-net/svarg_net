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
import { ImagePlugin } from "@platejs/media/react";
import {
  Plate,
  PlateContent,
  PlateElement,
  usePlateEditor,
  type PlateElementProps,
} from "@platejs/core/react";
import type { PlateValue } from "@/lib/plate-types";

type PlateRendererProps = {
  content: PlateValue;
};

export default function PlateRenderer({ content }: PlateRendererProps) {
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
    value: content || [],
    override: {
      components: {
        img: ImageElement,
      },
    },
  });

  return (
    <Plate editor={editor} readOnly>
      <PlateContent
        style={{
          outline: "none",
        }}
        className="md-preview"
      />
    </Plate>
  );
}

/**
 * Рендеринг изображений в публичных постах
 */
function ImageElement(props: PlateElementProps) {
  const element = props.element as { url?: string; alt?: string };

  return (
    <PlateElement {...props}>
      <figure
        contentEditable={false}
        style={{
          margin: "24px 0",
          textAlign: "center",
        }}
      >
        <img
          src={element.url}
          alt={element.alt || ""}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
          }}
        />
        {element.alt ? (
          <figcaption
            style={{
              fontSize: "14px",
              color: "#666",
              marginTop: "8px",
              fontStyle: "italic",
            }}
          >
            {element.alt}
          </figcaption>
        ) : null}
      </figure>
    </PlateElement>
  );
}
