"use client";

import Link from "next/link";
import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Новый пост</h1>
        <div className="admin-nav">
          <Link href="/admin/posts">Назад к списку</Link>
        </div>
      </div>
      <PostForm mode="create" />
    </div>
  );
}
