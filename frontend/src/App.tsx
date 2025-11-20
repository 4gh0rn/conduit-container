import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createArticle, deleteArticle, fetchArticles } from "./api";
import type { ApiState, Article } from "./types";

type DraftArticle = Omit<Article, "id">;

const emptyDraft: DraftArticle = {
  title: "",
  description: "",
  body: "",
  author: "",
};

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [state, setState] = useState<ApiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftArticle>(emptyDraft);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeTab, setActiveTab] = useState<"new" | number>("new");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ article: Article } | null>(null);
  const [closeTabDialog, setCloseTabDialog] = useState<boolean>(false);

  const handleNewArticle = useCallback(() => {
    setActiveTab("new");
    setSelectedArticle(null);
    setDraft(emptyDraft);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialog(null);
  }, []);

  const handleCloseTabCancel = useCallback(() => {
    setCloseTabDialog(false);
  }, []);

  const hasUnsavedChanges = draft.title || draft.body || draft.author || draft.description;

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    fetchArticles(controller.signal)
      .then((data) => {
        setArticles(data);
        setState("success");
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message);
        setState("error");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (deleteDialog) {
          handleDeleteCancel();
          return;
        }
        if (closeTabDialog) {
          handleCloseTabCancel();
          return;
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (activeTab === "new" && hasUnsavedChanges) {
          const form = document.querySelector(".editor-form") as HTMLFormElement;
          if (form) {
            form.requestSubmit();
          }
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "n") {
        event.preventDefault();
        handleNewArticle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, hasUnsavedChanges, handleNewArticle, deleteDialog, closeTabDialog, handleDeleteCancel, handleCloseTabCancel]);

  const statusText = useMemo(() => {
    if (state === "loading") return "Syncing articles…";
    if (state === "error") return `Failed to load data: ${error}`;
    if (state === "success") return `Showing ${articles.length} articles`;
    return "Idle";
  }, [state, articles.length, error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("loading");
    setError(null);
    try {
      const article = await createArticle(draft);
      setArticles((prev) => [article, ...prev]);
      setDraft(emptyDraft);
      setState("success");
      setNotification({ type: "success", message: `Article "${article.title}" published successfully!` });
      setActiveTab(article.id);
      setSelectedArticle(article);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setState("error");
      setNotification({ type: "error", message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleSelectArticle = (article: Article) => {
    setActiveTab(article.id);
    setSelectedArticle(article);
  };

  const handleCloseTab = (tabId: "new" | number) => {
    if (tabId === "new") {
      if (hasUnsavedChanges) {
        setCloseTabDialog(true);
        return;
      }
      setDraft(emptyDraft);
      if (articles.length > 0) {
        setActiveTab(articles[0].id);
        setSelectedArticle(articles[0]);
      }
    } else {
      if (activeTab === tabId) {
        if (articles.length > 0) {
          const remainingArticles = articles.filter(a => a.id !== tabId);
          if (remainingArticles.length > 0) {
            setActiveTab(remainingArticles[0].id);
            setSelectedArticle(remainingArticles[0]);
          } else {
            setActiveTab("new");
            setSelectedArticle(null);
          }
        } else {
          setActiveTab("new");
          setSelectedArticle(null);
        }
      }
    }
  };

  const handleDeleteClick = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setDeleteDialog({ article });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog) return;
    
    const article = deleteDialog.article;
    setDeleteDialog(null);
    setState("loading");
    setError(null);
    try {
      await deleteArticle(article.id);
      const updatedArticles = articles.filter(a => a.id !== article.id);
      setArticles(updatedArticles);
      
      // Close tab if it was open
      if (activeTab === article.id) {
        if (updatedArticles.length > 0) {
          setActiveTab(updatedArticles[0].id);
          setSelectedArticle(updatedArticles[0]);
        } else {
          setActiveTab("new");
          setSelectedArticle(null);
        }
      }
      
      setState("success");
      setNotification({ type: "success", message: `Article "${article.title}" deleted successfully!` });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setState("error");
      setNotification({ type: "error", message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCloseTabConfirm = useCallback(() => {
    setCloseTabDialog(false);
    setDraft(emptyDraft);
    if (articles.length > 0) {
      setActiveTab(articles[0].id);
      setSelectedArticle(articles[0]);
    }
  }, [articles]);

  return (
    <div className="vscode-container">
      <div className="vscode-main">
        <div className="activity-bar">
          <div className="activity-icon active" title="Explorer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2v12h12V2H2zm1 1h10v10H3V3zm1 1v8h8V4H4zm1 1h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/>
            </svg>
          </div>
        </div>

        <div className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">EXPLORER</span>
          <button className="new-article-btn" onClick={handleNewArticle} title="New Article (Ctrl+N)">
            <span>+</span>
          </button>
        </div>
        <div className="file-tree">
          <div className="tree-item folder">
            <span className="tree-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3.5C2 2.67 2.67 2 3.5 2h2.379a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.121 4H12.5c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5h-9A1.5 1.5 0 0 1 2 12.5v-9zM3.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5H9.121a1.5 1.5 0 0 1-1.06-.44L6.94 3.44A1.5 1.5 0 0 0 5.879 3H3.5z"/>
              </svg>
            </span>
            <span>ARTICLES</span>
            <span className="tree-count">({articles.length})</span>
          </div>
          {articles.map((article) => (
            <div
              key={article.id}
              className={`tree-item file ${activeTab === article.id ? "active" : ""}`}
              onClick={() => handleSelectArticle(article)}
            >
              <span className="tree-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.414a1 1 0 0 0-.293-.707l-3.414-3.414A1 1 0 0 0 9.586 2H4zm0 1h5.586L12 5.414V13H4V3z"/>
                </svg>
              </span>
              <span className="file-name">{article.title}</span>
              <button
                className="tree-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(article.id);
                }}
                title="Delete Article"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84L13.962 3.5H14.5a.5.5 0 0 0 0-1h-1.006a.58.58 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Z"/>
                </svg>
              </button>
            </div>
          ))}
          {articles.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" opacity="0.3">
                  <path d="M4 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6.414a1 1 0 0 0-.293-.707l-3.414-3.414A1 1 0 0 0 9.586 2H4zm0 1h5.586L12 5.414V13H4V3z"/>
                </svg>
              </span>
              <span className="empty-text">No articles yet</span>
              <span className="empty-hint">Click + to create one</span>
            </div>
          )}
        </div>
      </div>

      <div className="editor-area">
        <div className="editor-tabs">
          <div className={`tab ${activeTab === "new" ? "active" : ""}`}>
            <span>new-article.md{hasUnsavedChanges ? " •" : ""}</span>
            <span className="tab-close" onClick={() => handleCloseTab("new")} title="Close">×</span>
          </div>
          {articles.map((article) => (
            <div
              key={article.id}
              className={`tab ${activeTab === article.id ? "active" : ""}`}
              onClick={() => handleSelectArticle(article)}
            >
              <span>{article.title}.md</span>
              <span className="tab-close" onClick={(e) => { e.stopPropagation(); handleCloseTab(article.id); }} title="Close">×</span>
            </div>
          ))}
        </div>

        <div className="editor-content">
          {activeTab !== "new" && selectedArticle ? (
            <div className="editor-view">
              <div className="editor-line-numbers">
                {selectedArticle.body.split("\n").map((_, i) => (
                  <div key={i} className="line-number">{i + 1}</div>
                ))}
              </div>
              <div className="editor-text">
                <div className="editor-header">
                  <div className="file-meta-group">
                    <span className="file-meta">Author: {selectedArticle.author}</span>
                    <span className="file-meta">Description: {selectedArticle.description}</span>
                  </div>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteClick(selectedArticle.id)}
                    title="Delete Article"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84L13.962 3.5H14.5a.5.5 0 0 0 0-1h-1.006a.58.58 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Z"/>
                    </svg>
                    Delete
                  </button>
                </div>
                <pre className="code-content">{selectedArticle.body}</pre>
              </div>
            </div>
          ) : (
            <div className="editor-view">
              <div className="editor-text">
                <div className="editor-welcome">
                  <h2>Create New Article</h2>
                  <p>Fill in the form below to create a new article. Use <kbd>Ctrl+S</kbd> or click "Publish Article" to save.</p>
                </div>
                <form onSubmit={handleSubmit} className="editor-form">
                  <div className="form-group">
                    <label>Title <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g., Getting Started with Docker"
                      value={draft.title}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, title: event.target.value }))
                      }
                      required
                      className="editor-input"
                      autoFocus
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Author <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={draft.author}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, author: event.target.value }))
                        }
                        required
                        className="editor-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description <span className="required">*</span></label>
                      <input
                        type="text"
                        placeholder="Brief summary"
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((prev) => ({ ...prev, description: event.target.value }))
                        }
                        required
                        className="editor-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Content <span className="required">*</span></label>
                    <textarea
                      placeholder="Write your article content here...&#10;&#10;You can use multiple lines and paragraphs."
                      value={draft.body}
                      onChange={(event) =>
                        setDraft((prev) => ({ ...prev, body: event.target.value }))
                      }
                      required
                      className="editor-textarea"
                      rows={20}
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="editor-button primary" disabled={state === "loading"}>
                      {state === "loading" ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", marginRight: "6px", animation: "spin 1s linear infinite" }}>
                            <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" opacity="0.3"/>
                            <path d="M8 0a8 8 0 0 1 8 8h-1.5A6.5 6.5 0 0 0 8 1.5z">
                              <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
                            </path>
                          </svg>
                          Publishing...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", marginRight: "6px" }}>
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                          </svg>
                          Publish Article
                        </>
                      )}
                    </button>
                    {hasUnsavedChanges && (
                      <span className="unsaved-indicator">Unsaved changes</span>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      <div className="status-bar">
        <div className="status-bar-left">
          <span className="status-item">
            {state === "loading" ? (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", marginRight: "4px", animation: "spin 1s linear infinite" }}>
                  <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" opacity="0.3"/>
                  <path d="M8 0a8 8 0 0 1 8 8h-1.5A6.5 6.5 0 0 0 8 1.5z">
                    <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="1s" repeatCount="indefinite"/>
                  </path>
                </svg>
              </>
            ) : state === "error" ? (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", marginRight: "4px" }}>
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7z"/>
                </svg>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ display: "inline-block", marginRight: "4px" }}>
                  <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
                </svg>
              </>
            )} {statusText}
          </span>
        </div>
        <div className="status-bar-right">
          {activeTab === "new" && hasUnsavedChanges && (
            <span className="status-item unsaved">● Unsaved</span>
          )}
          <span className="status-item">Ln 1, Col 1</span>
          <span className="status-item">Spaces: 2</span>
          <span className="status-item">UTF-8</span>
        </div>
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          <span>
            {notification.type === "success" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7z"/>
              </svg>
            )}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {deleteDialog && (
        <div className="dialog-overlay" onClick={handleDeleteCancel}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-icon">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7z"/>
                </svg>
              </div>
              <div className="dialog-title">Delete Article</div>
            </div>
            <div className="dialog-content">
              <p>Are you sure you want to delete <strong>"{deleteDialog.article.title}"</strong>?</p>
              <p className="dialog-warning">This action cannot be undone.</p>
            </div>
            <div className="dialog-actions">
              <button className="dialog-button secondary" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="dialog-button danger" onClick={handleDeleteConfirm}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: "6px" }}>
                  <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 0H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84L13.962 3.5H14.5a.5.5 0 0 0 0-1h-1.006a.58.58 0 0 0-.01 0H11Zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5h9.916Z"/>
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {closeTabDialog && (
        <div className="dialog-overlay" onClick={handleCloseTabCancel}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div className="dialog-icon">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM4.5 7.5a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1h-7z"/>
                </svg>
              </div>
              <div className="dialog-title">Unsaved Changes</div>
            </div>
            <div className="dialog-content">
              <p>You have unsaved changes. Are you sure you want to close?</p>
            </div>
            <div className="dialog-actions">
              <button className="dialog-button secondary" onClick={handleCloseTabCancel}>
                Cancel
              </button>
              <button className="dialog-button primary" onClick={handleCloseTabConfirm}>
                Close Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

