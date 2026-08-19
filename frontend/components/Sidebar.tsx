import Link from "next/link";
import { getCategories, getTags, type Category, type Tag } from "@/lib/api";

export default async function Sidebar() {
  let categories: Category[] = [];
  let tags: Tag[] = [];

  try {
    const [catResponse, tagResponse] = await Promise.all([
      getCategories(),
      getTags(),
    ]);
    categories = catResponse.items || [];
    tags = tagResponse.items || [];
  } catch (err) {
    console.error("Failed to load sidebar data:", err);
  }

  return (
    <aside className="sidebar">
      {/* Категории */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">Категории</h3>
        {categories.length === 0 ? (
          <p className="sidebar-empty">Нет категорий</p>
        ) : (
          <nav className="sidebar-nav">
            <Link href="/" className="sidebar-link">
              Все посты
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="sidebar-link"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Теги */}
      <div className="sidebar-section">
        <h3 className="sidebar-title">Теги</h3>
        {tags.length === 0 ? (
          <p className="sidebar-empty">Нет тегов</p>
        ) : (
          <div className="sidebar-tags">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="sidebar-tag"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}