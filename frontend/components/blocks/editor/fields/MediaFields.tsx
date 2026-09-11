"use client";

import { useState } from "react";
import MediaPicker from "@/components/MediaPicker";
import PlateEditor from "@/components/PlateEditor";
import type { MediaFile } from "@/lib/api";
import type {
  GalleryBlockData,
  ImageBlockData,
  ImageTextBlockData,
} from "@/lib/api/blocks";
import { emptyPlate } from "../constants";

type FieldProps<T> = {
  data: T;
  onChange: (data: Record<string, unknown>) => void;
};

const previewSrc = (item: { media_id?: number; url?: string }): string =>
  item.media_id ? `/api/v1/media/${item.media_id}/file` : item.url || "";

export function ImageFields({ data, onChange }: FieldProps<ImageBlockData>) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (media: MediaFile) => {
    onChange({ ...data, media_id: media.id, url: "" });
  };

  const src = previewSrc(data);

  return (
    <>
      <div className="block-editor-field">
        <label>Картинка</label>
        {src && (
          <div style={{ marginBottom: "12px" }}>
            <img
              src={src}
              alt=""
              style={{ maxWidth: "100%", maxHeight: "300px", borderRadius: "8px" }}
            />
          </div>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPicker(true)}
        >
          {data.media_id ? "Изменить картинку" : "Выбрать картинку"}
        </button>
      </div>

      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Подпись</label>
          <input
            value={data.caption || ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Описание картинки"
          />
        </div>

        <div className="block-editor-field">
          <label>Выравнивание</label>
          <select
            value={data.align || "center"}
            onChange={(e) => onChange({ ...data, align: e.target.value })}
          >
            <option value="left">Слева</option>
            <option value="center">По центру</option>
            <option value="right">Справа</option>
          </select>
        </div>
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

export function ImageTextFields({
  data,
  onChange,
}: FieldProps<ImageTextBlockData>) {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelect = (media: MediaFile) => {
    onChange({ ...data, media_id: media.id, url: "" });
  };

  const src = previewSrc(data);

  return (
    <>
      <div className="block-editor-two-cols">
        <div className="block-editor-field">
          <label>Картинка</label>
          {src && (
            <div style={{ marginBottom: "12px" }}>
              <img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowPicker(true)}
          >
            {data.media_id ? "Изменить" : "Выбрать"}
          </button>
        </div>

        <div className="block-editor-field">
          <label>Расположение картинки</label>
          <select
            value={data.layout || "left"}
            onChange={(e) => onChange({ ...data, layout: e.target.value })}
          >
            <option value="left">Слева</option>
            <option value="right">Справа</option>
          </select>

          <label style={{ marginTop: "14px" }}>Подпись</label>
          <input
            value={data.caption || ""}
            onChange={(e) => onChange({ ...data, caption: e.target.value })}
            placeholder="Описание картинки"
          />
        </div>
      </div>

      <div className="block-editor-field">
        <label>Текст</label>
        <PlateEditor
          initialValue={data.content_json || emptyPlate}
          onChange={(next) => onChange({ ...data, content_json: next })}
        />
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

export function GalleryFields({
  data,
  onChange,
}: FieldProps<GalleryBlockData>) {
  const [showPicker, setShowPicker] = useState(false);
  const items = data.items || [];

  const handleSelect = (media: MediaFile) => {
    onChange({
      ...data,
      items: [...items, { media_id: media.id, url: "", caption: "" }],
    });
  };

  const handleRemove = (index: number) => {
    onChange({ ...data, items: items.filter((_, i) => i !== index) });
  };

  const handleCaptionChange = (index: number, caption: string) => {
    onChange({
      ...data,
      items: items.map((item, i) =>
        i === index ? { ...item, caption } : item
      ),
    });
  };

  return (
    <>
      <div className="block-editor-field">
        <label>Layout</label>
        <select
          value={data.layout || "grid"}
          onChange={(e) => onChange({ ...data, layout: e.target.value })}
        >
          <option value="grid">Сетка</option>
          <option value="slider">Слайдер</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>

      <div className="block-editor-field">
        <label>Картинки ({items.length})</label>
        {items.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <img
                  src={previewSrc(item)}
                  alt=""
                  style={{ width: "100%", height: "120px", objectFit: "cover" }}
                />
                <div style={{ padding: "8px" }}>
                  <input
                    type="text"
                    value={item.caption || ""}
                    onChange={(e) => handleCaptionChange(i, e.target.value)}
                    placeholder="Подпись"
                    style={{
                      width: "100%",
                      fontSize: "12px",
                      padding: "4px 6px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      marginBottom: "6px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    style={{
                      width: "100%",
                      padding: "4px",
                      background: "#c33",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPicker(true)}
        >
          + Добавить картинку
        </button>
      </div>

      {showPicker && (
        <MediaPicker
          isOpen={true}
          onSelect={handleSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
