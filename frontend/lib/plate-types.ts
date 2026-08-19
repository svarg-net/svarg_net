// Типы для Plate.js контента
// Импортируем типы из @platejs/slate для полной совместимости

import type { 
  Value, 
  Descendant, 
  TElement, 
  TNode, 
  TText,
  Element,
  Text,
} from "@platejs/slate";

// Переэкспортируем основной тип Value
export type PlateValue = Value;

// Переэкспортируем другие полезные типы
export type { Descendant, TElement, TNode, TText, Element, Text };

// Helper для проверки что нода является элементом
export function isElement(node: Descendant): node is Element {
  return "type" in node && "children" in node;
}

// Helper для проверки что нода является текстом
export function isText(node: Descendant): node is Text {
  return "text" in node;
}

// Типы для кастомных нод (для удобства)
export type ParagraphElement = TElement & {
  type: "p";
};

export type HeadingElement = TElement & {
  type: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
};

export type BlockquoteElement = TElement & {
  type: "blockquote";
};

export type ListElement = TElement & {
  type: "ul" | "ol";
};

export type ListItemElement = TElement & {
  type: "li";
};

export type CodeBlockElement = TElement & {
  type: "code_block";
};

export type LinkElement = TElement & {
  type: "a";
  url: string;
};

// Union тип для всех возможных элементов
export type CustomElement =
  | ParagraphElement
  | HeadingElement
  | BlockquoteElement
  | ListElement
  | ListItemElement
  | CodeBlockElement
  | LinkElement;