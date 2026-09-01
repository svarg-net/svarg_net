"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getMedia,
  uploadMedia,
  deleteMedia,
  formatFileSize,
  type MediaFile,
} from "@/lib/api/media";
import { useAuth } from "@/context/AuthContext";
import AdminNav from "@/components/AdminNav";

export default function AdminMediaPage() {
  const { logout: authLogout } = useAuth();
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const response = await getMedia(100);
      setMedia(response.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        await uploadMedia(file);
      }
      await loadMedia();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleUpload(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Удалить файл "${name}"?`)) return;

    try {
      await deleteMedia(id);
      setMedia(media.filter((m) => m.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    window.location.href = "/admin/login";
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL скопирован: " + url);
  };

  if (loading) {
    return (
      <div className="admin-container">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Медиабиблиотека</h1>
        <div className="admin-nav">
          <Link href="/">На сайт</Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            Выйти
          </button>
        </div>
      </div>

      <AdminNav />

      {error && <div className="error-message">{error}</div>}

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#0066cc" : "#ccc"}`,
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          marginBottom: "30px",
          background: dragOver ? "#f0f7ff" : "#fafafa",
          transition: "all 0.2s",
        }}
      >
        <p style={{ marginBottom: "15px", fontSize: "16px" }}>
          {uploading
            ? "Загрузка..."
            : dragOver
              ? "Отпустите файл для загрузки"
              : "Перетащите изображения сюда или выберите файл"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="file-upload"
        />
        <label htmlFor="file-upload" className="btn btn-primary" style={{ cursor: "pointer" }}>
          Выбрать файлы
        </label>
        <p style={{ marginTop: "10px", color: "#666", fontSize: "13px" }}>
          Допустимые форматы: JPG, PNG, GIF, WebP. Максимум 5MB.
        </p>
      </div>

      {/* Галерея */}
      {media.length === 0 ? (
        <div className="empty-state">
          <p>Файлы не загружены</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {media.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#fff",
              }}
            >
              <div
                style={{
                  height: "160px",
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
                    maxHeight: "160px",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div style={{ padding: "12px" }}>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "13px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.original_name}
                >
                  {item.original_name}
                </p>
                <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#666" }}>
                  {formatFileSize(item.size_bytes)} · {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </p>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => copyUrl(item.url)}
                    className="btn btn-secondary"
                    style={{ fontSize: "12px", padding: "4px 10px", flex: 1 }}
                  >
                    URL
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.original_name)}
                    className="btn btn-danger"
                    style={{ fontSize: "12px", padding: "4px 10px", flex: 1 }}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
