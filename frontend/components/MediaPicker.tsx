"use client";

import { useEffect, useState } from "react";
import {
  getMedia,
  uploadMedia,
  type MediaFile,
} from "@/lib/api";
import "@/styles/media-picker.css";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaFile) => void;
};

export default function MediaPicker({ isOpen, onClose, onSelect }: Props) {
  const [items, setItems] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaFile | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMedia();
      setItems(res.items || []);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      load();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setItems((prev) => [uploaded, ...prev]);
      setSelected(uploaded);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <div className="media-picker-overlay" onClick={onClose}>
      <div className="media-picker" onClick={(e) => e.stopPropagation()}>
        <div className="media-picker-header">
          <h3>Выберите картинку</h3>
          <button type="button" onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="media-picker-toolbar">
          <label className="upload-btn">
            {uploading ? "Загрузка..." : "📤 Загрузить новую"}
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {loading ? (
          <div className="media-picker-loading">Загрузка...</div>
        ) : items.length === 0 ? (
          <div className="media-picker-empty">
            Нет загруженных картинок
          </div>
        ) : (
          <div className="media-picker-grid">
            {items.map((item) => {
              const src = item.url || `/api/v1/media/${item.id}/file`;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    "media-picker-item" +
                    (selected?.id === item.id ? " selected" : "")
                  }
                  onClick={() => setSelected(item)}
                >
                  <img src={src} alt={item.original_name} loading="lazy" />
                  <div className="media-picker-item-name">
                    {item.original_name || item.filename}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="media-picker-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected}
            className="btn-primary"
          >
            Выбрать
          </button>
        </div>
      </div>
    </div>
  );
}
