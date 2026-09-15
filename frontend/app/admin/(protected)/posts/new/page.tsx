"use client";

import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <div className="admin-container">
      <PostForm mode="create" />
    </div>
  );
}
