import type { PlateValue } from "@/lib/plate-types";
import type { BlockType } from "@/lib/api/blocks";

export const emptyPlate: PlateValue = [
  { type: "p", children: [{ text: "" }] },
];

export const blockLabels: Record<string, string> = {
  text: "📝 Текст",
  image: "🖼️ Картинка",
  "image-text": "📰 Картинка + текст",
  code: "💻 Код",
  gallery: "📸 Галерея",
  quote: "📌 Цитата",
  callout: "📢 Callout",
  divider: "➗ Разделитель",
  table: "📊 Таблица",
  video: "🎬 Видео",
  tabs: "🗂 Вкладки",
  quiz: "❓ Викторина",
};

export type AddableBlock = {
  type: BlockType;
  label: string;
  defaultData: Record<string, unknown>;
};

export const addableBlocks: AddableBlock[] = [
  {
    type: "text",
    label: "Текст",
    defaultData: { content_json: emptyPlate },
  },
  {
    type: "image",
    label: "Картинка",
    defaultData: { media_id: undefined, caption: "", align: "center" },
  },
  {
    type: "image-text",
    label: "Картинка + текст",
    defaultData: {
      media_id: undefined,
      caption: "",
      layout: "left",
      content_json: emptyPlate,
    },
  },
  {
    type: "code",
    label: "Код",
    defaultData: {
      language: "go",
      filename: "",
      code: "package main\n\nfunc main() {\n\n}",
    },
  },
  {
    type: "gallery",
    label: "Галерея",
    defaultData: { items: [], layout: "grid" },
  },
  {
    type: "callout",
    label: "Callout",
    defaultData: { type: "info", title: "Важно", text: "Текст заметки" },
  },
  {
    type: "quote",
    label: "Цитата",
    defaultData: { text: "Текст цитаты", author: "", source: "" },
  },
  {
    type: "divider",
    label: "Разделитель",
    defaultData: { style: "line" },
  },
    {
    type: "table",
    label: "Таблица",
    defaultData: {
      header: true,
      rows: [
        ["Колонка 1", "Колонка 2"],
        ["", ""],
      ],
    },
  },
  {
    type: "video",
    label: "Видео",
    defaultData: { url: "", provider: "", caption: "" },
  },
  {
    type: "tabs",
    label: "Вкладки",
    defaultData: {
      items: [{ title: "Вкладка 1", content_json: emptyPlate }],
    },
  },
  {
    type: "quiz",
    label: "Викторина",
    defaultData: {
      question: "",
      options: ["", ""],
      correct_index: 0,
      explanation: "",
    },
  },
];
