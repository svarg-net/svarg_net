"use client";

import type { ReactNode } from "react";

/**
 * Безопасный мини-рендерер markdown для комментариев.
 * Поддерживает: **жирный**, *курсив*, `код`, ```блок кода```, > цитату, абзацы.
 * Ссылки НЕ поддерживаются намеренно (защита от спама).
 */

const escape = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Применяет inline-форматирование к уже escaped строке */
function renderInline(s: string): ReactNode[] {
  // Порядок важен: сначала блоки кода (не трогаем содержимое), потом inline
  const parts: ReactNode[] = [];
  let i = 0;
  const len = s.length;
  let key = 0;

  while (i < len) {
    // inline code: `...`
    if (s[i] === "`") {
      const end = s.indexOf("`", i + 1);
      if (end !== -1) {
        parts.push(
          <code key={key++} className="cm-inline-code">
            {s.slice(i + 1, end)}
          </code>
        );
        i = end + 1;
        continue;
      }
    }

    // Жирный: **...**
    if (s[i] === "*" && s[i + 1] === "*") {
      const end = s.indexOf("**", i + 2);
      if (end !== -1) {
        parts.push(<strong key={key++}>{s.slice(i + 2, end)}</strong>);
        i = end + 2;
        continue;
      }
    }

    // Курсив: *...* (только один *)
    if (s[i] === "*" && s[i + 1] !== "*") {
      const end = findSingleStarEnd(s, i + 1);
      if (end !== -1) {
        parts.push(<em key={key++}>{s.slice(i + 1, end)}</em>);
        i = end + 1;
        continue;
      }
    }

    // Обычный символ
    parts.push(<span key={key++}>{s[i]}</span>);
    i++;
  }

  return parts;
}

function findSingleStarEnd(s: string, from: number): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] === "*" && s[i - 1] !== "*" && s[i + 1] !== "*") {
      return i;
    }
  }
  return -1;
}

/** Рендерит markdown в React-дерево */
export default function CommentMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Пустая строка → разделитель (игнорируем)
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Блок кода: ```
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // пропускаем закрывающую ```
      nodes.push(
        <pre key={key++} className="cm-code-block">
          <code>{escape(codeLines.join("\n"))}</code>
        </pre>
      );
      continue;
    }

    // Цитата: > ...
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(escape(lines[i].slice(2)));
        i++;
      }
      nodes.push(
        <blockquote key={key++} className="cm-quote">
          {quoteLines.map((q, idx) => (
            <p key={idx}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Обычный абзац — собираем до пустой строки или служебной
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].startsWith("> ")
    ) {
      paraLines.push(escape(lines[i]));
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push(
        <p key={key++} className="cm-paragraph">
          {renderInline(paraLines.join(" "))}
        </p>
      );
    }
  }

  return <div className="comment-markdown">{nodes}</div>;
}
