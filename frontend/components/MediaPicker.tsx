"use client";

import { useEffect, useState } from "react";
import { getMedia, type MediaFile } from "@/lib/api/media";

type MediaPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
};

export default function MediaPicker({ isOpen, onClose, onSelect }: MediaPickerProps) {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const response = await getMedia(100);
      setMedia(response.items || []);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          padding: "20px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Выберите изображение</h2>
          <button onClick={onClose} className="btn btn-secondary">
            Закрыть
          </button>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : media.length === 0 ? (
          <p>Нет загруженных изображений. Загрузите файлы в медиабиблиотеке.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "15px",
            }}
          >
            {media.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelect(item.url, item.original_name)}
                style={{
                  cursor: "pointer",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  overflow: "hidden",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0066cc";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,102,204,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#ddd";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    height: "120px",
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.original_name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "120px",
                      objectFit: "contain",
                    }}
                  />
                </div>
                <div style={{ padding: "8px" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.original_name}
                  >
                    {item.original_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
