import type { Article } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function fetchArticles(signal?: AbortSignal): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/articles`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load articles: ${response.statusText}`);
  }
  const data = await response.json();
  return data.articles ?? [];
}

export async function createArticle(
  article: Omit<Article, "id">,
): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(article),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to create article");
  }

  const data = await response.json();
  return data.article;
}

export async function deleteArticle(articleId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/articles/${articleId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error ?? "Failed to delete article");
  }
}

