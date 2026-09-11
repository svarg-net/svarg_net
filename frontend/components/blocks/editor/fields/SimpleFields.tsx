"use client";

import type {
  CalloutBlockData,
  CodeBlockData,
  DividerBlockData,
  QuoteBlockData,
} from "@/lib/api/blocks";

type FieldProps<T> = {
  data: T;
  onChange: (data: Record<string, unknown>) => void;
};

export function CodeFields({ data, onChange }: FieldProps<CodeBlockData>) {
  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Язык</label>
          <input
            value={data.language || ""}
            onChange={(e) => onChange({ ...data, language: e.target.value })}
            placeholder="go, ts, bash..."
          />
        </div>
        <div className="block-editor-field">
          <label>Имя файла</label>
          <input
            value={data.filename || ""}
            onChange={(e) => onChange({ ...data, filename: e.target.value })}
            placeholder="main.go"
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Код</label>
        <textarea
          className="code"
          value={data.code || ""}
          onChange={(e) => onChange({ ...data, code: e.target.value })}
        />
      </div>
    </>
  );
}

export function CalloutFields({
  data,
  onChange,
}: FieldProps<CalloutBlockData>) {
  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Тип</label>
          <select
            value={data.type || "info"}
            onChange={(e) => onChange({ ...data, type: e.target.value })}
          >
            <option value="info">info</option>
            <option value="success">success</option>
            <option value="warning">warning</option>
            <option value="error">error</option>
          </select>
        </div>

        <div className="block-editor-field">
          <label>Заголовок</label>
          <input
            value={data.title || ""}
            onChange={(e) => onChange({ ...data, title: e.target.value })}
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Текст</label>
        <textarea
          value={data.text || ""}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>
    </>
  );
}

export function QuoteFields({ data, onChange }: FieldProps<QuoteBlockData>) {
  return (
    <>
      <div className="block-editor-field">
        <label>Цитата</label>
        <textarea
          value={data.text || ""}
          onChange={(e) => onChange({ ...data, text: e.target.value })}
        />
      </div>

      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Автор</label>
          <input
            value={data.author || ""}
            onChange={(e) => onChange({ ...data, author: e.target.value })}
          />
        </div>

        <div className="block-editor-field">
          <label>Источник</label>
          <input
            value={data.source || ""}
            onChange={(e) => onChange({ ...data, source: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

export function DividerFields({
  data,
  onChange,
}: FieldProps<DividerBlockData>) {
  return (
    <div className="block-editor-field">
      <label>Стиль</label>
      <select
        value={data.style || "line"}
        onChange={(e) => onChange({ ...data, style: e.target.value })}
      >
        <option value="line">Линия</option>
        <option value="dots">Точки</option>
        <option value="space">Пустой отступ</option>
      </select>
    </div>
  );
}
