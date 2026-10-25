
import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  AudioLines,
  BrainCircuit,
  CheckCircle2,
  FileCode2,
  FileText,
  Folder,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Video,
  Wifi,
} from "lucide-react";
import "./App.css";

const API = "http://localhost:8000";

type Category =
  | "Documents"
  | "Images"
  | "Videos"
  | "Audio"
  | "Archives"
  | "Code"
  | "Other";

type FileItem = {
  name: string;
  extension: string;
  size_bytes: number;
  current_folder: string;
  suggested_category: Category;
  classification_source?: string;
};


type PreviewItem = {
  name: string;
  extension: string;
  size_bytes: number;
  current_folder: string;
  suggested_category: Category;
  destination_folder: string;
  reason: string;
  confidence: number;
  needs_review: boolean;
  classification_source: string;
};


type Health = {
  backend: string;
  ollama: string;
  model: string;
  model_installed?: boolean;
};

const categoryIcons: Record<Category, typeof Folder> = {
  Documents: FileText,
  Images: ImageIcon,
  Videos: Video,
  Audio: AudioLines,
  Archives: Archive,
  Code: FileCode2,
  Other: Folder,
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState<"scan" | "preview" | "health" | null>(
    null
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${API}/api/health`);
      if (!response.ok) throw new Error("Health check failed");
      setHealth(await response.json());
    } catch {
      setHealth(null);
    }
  }, []);

  const scanFiles = useCallback(async () => {
    setLoading("scan");
    setError("");
    setNotice("");
    setPreview([]);

    try {
      const response = await fetch(`${API}/api/scan`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not scan files.");
      }

      setFiles(data.files);
      setNotice(`Scan complete: found ${data.count} files.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the SlothSort backend."
      );
    } finally {
      setLoading(null);
    }
  }, []);

  const generatePreview = useCallback(async () => {
    setLoading("preview");
    setError("");
    setNotice("");
    setPreview([]);

    try {
      const response = await fetch(`${API}/api/preview`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not generate AI preview.");
      }

      setPreview(data.items);
      setNotice(
        `AI preview ready: ${data.count} files classified. No files were changed.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not generate the preview."
      );
    } finally {
      setLoading(null);
    }
  }, []);

  
const updatePreviewCategory = (
  filename: string,
  category: Category
) => {
  setPreview((current) =>
    current.map((item) =>
      item.name === filename
        ? {
            ...item,
            suggested_category: category,
            destination_folder: category,
            needs_review: true,
            reason: "Category manually selected. Review before any future action.",
            classification_source: "manual",
          }
        : item
    )
  );
};

  useEffect(() => {
    void checkHealth();
    void scanFiles();
  }, [checkHealth, scanFiles]);

  const previewByName = new Map(preview.map((item) => [item.name, item]));

  const displayedFiles = files.filter((file) => {
    if (activeCategory === "All") return true;

    const category =
      previewByName.get(file.name)?.suggested_category ??
      file.suggested_category;

    return category === activeCategory;
  });

  const categories: Category[] = [
    "Documents",
    "Images",
    "Videos",
    "Audio",
    "Archives",
    "Code",
    "Other",
  ];

  const categoryCounts = categories.map((category) => ({
    category,
    count: files.filter(
      (file) =>
        (previewByName.get(file.name)?.suggested_category ??
          file.suggested_category) === category
    ).length,
  }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">
          <div className="brand-mark">
            <Folder size={23} />
          </div>
          <div>
            <strong>SlothSort</strong>
            <span>Slow down. Stay organized.</span>
          </div>
        </a>

        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active" onClick={() => setActiveCategory("All")}>
          <Folder size={18} /> File overview
        </button>

        <div className="side-label">CATEGORIES</div>
        {categories.map((category) => {
          const Icon = categoryIcons[category];

          return (
            <button
              key={category}
              className={`nav-item ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              <Icon size={18} />
              <span>{category}</span>
              <span className="nav-count">
                {categoryCounts.find((item) => item.category === category)?.count ??
                  0}
              </span>
            </button>
          );
        })}

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <ShieldCheck size={21} />
            <strong>Your files stay local</strong>
            <p>SlothSort sends filenames to your local Ollama model for classification. It does not read file contents.</p>
          </div>
          <span className="version">SLOTHSORT · MVP 0.1</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>File overview</strong>
          </div>
          <div className="local-badge">
            <span className="status-dot" />
            Local workspace
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow">
              <BrainCircuit size={15} /> AI-POWERED ORGANIZATION
            </div>
            <h1>A little less clutter.</h1>
            <p>Let your local AI help organize the chaos, one file at a time.</p>
          </div>

          <button
            className="button button-secondary"
            onClick={() => {
              void checkHealth();
              void scanFiles();
            }}
            disabled={loading !== null}
          >
            <RefreshCw size={16} />
            Refresh scan
          </button>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><Folder size={20} /></div>
            <span>Total files scanned</span>
            <strong>{files.length}</strong>
            <small>In your sample folder</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle2 size={20} /></div>
            <span>Previewed by AI</span>
            <strong>{preview.length}</strong>
            <small>No changes applied</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber"><ScanSearch size={20} /></div>
            <span>Categories found</span>
            <strong>{categoryCounts.filter((item) => item.count > 0).length}</strong>
            <small>Based on current suggestions</small>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><Wifi size={20} /></div>
            <span>Local AI status</span>
            <strong className="status-value">
              {health?.ollama === "ok" && health?.model_installed
                ? "Ready"
                : health?.ollama === "ok"
                  ? "Model missing"
                  : "Offline"}
            </strong>
            <small>{health?.model ?? "Checking connection…"}</small>
          </div>
        </section>

        <section className="action-panel">
          <div className="action-copy">
            <div className="action-icon"><BrainCircuit size={23} /></div>
            <div>
              <h2>Ready for a little organization?</h2>
              <p>Scan your sample folder, then ask local AI to suggest categories.</p>
            </div>
          </div>
          <div className="action-buttons">
            <button
              className="button button-secondary"
              onClick={() => void scanFiles()}
              disabled={loading !== null}
            >
              {loading === "scan" ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <ScanSearch size={17} />
              )}
              Scan files
            </button>
            <button
              className="button button-primary"
              onClick={() => void generatePreview()}
              disabled={loading !== null || files.length === 0}
            >
              {loading === "preview" ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <BrainCircuit size={17} />
              )}
              Generate AI preview
            </button>
          </div>
        </section>

        {error && (
          <div className="message error-message">
            <strong>Something went wrong</strong>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="message success-message">
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        )}

        <section className="files-panel">
          <div className="panel-heading">
            <div>
              <h2>Your files</h2>
              <p>Review file metadata and AI suggestions before taking action.</p>
            </div>
            <span className="file-count">{displayedFiles.length} files</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>FILE NAME</th>
                  <th>TYPE</th>
                  <th>SIZE</th>
                  <th>AI CATEGORY</th>
                  <th>DESTINATION</th>
                </tr>
              </thead>
              <tbody>
                {displayedFiles.map((file) => {
                  const suggestion = previewByName.get(file.name);
                  const category =
                    suggestion?.suggested_category ?? file.suggested_category;
                  const Icon = categoryIcons[category];

                  return (
                    <tr key={file.name}>
                      <td>
                        <div className="file-name">
                          <div className="file-icon"><FileText size={17} /></div>
                          <span title={file.name}>{file.name}</span>
                        </div>
                      </td>
                      <td><span className="extension-tag">{file.extension || "No extension"}</span></td>
                      <td>{formatSize(file.size_bytes)}</td>
                      
<td>
  {suggestion ? (
    <div className="category-editor">
      <select
        aria-label={`Category for ${file.name}`}
        className="category-select"
        value={suggestion.suggested_category}
        onChange={(event) =>
          updatePreviewCategory(
            file.name,
            event.target.value as Category
          )
        }
      >
        {categories.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <span
        className={`review-tag ${
          suggestion.needs_review ? "review-needed" : "review-ok"
        }`}
      >
        {suggestion.needs_review ? "Review" : "Suggested"}
      </span>

      <span className="reason-text" title={suggestion.reason}>
        {suggestion.reason}
      </span>
    </div>
  ) : (
    <span className="category-tag">
      <Icon size={14} />
      {category}
    </span>
  )}
</td>

                      <td>
                        {suggestion ? (
                          <span className="destination">
                            <Folder size={15} />
                            {suggestion.destination_folder}/
                          </span>
                        ) : (
                          <span className="pending">Not previewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {displayedFiles.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        {loading ? (
                          <LoaderCircle className="spin" size={25} />
                        ) : (
                          <Folder size={28} />
                        )}
                        <strong>
                          {files.length === 0
                            ? "Your sample folder is empty"
                            : "No files in this category"}
                        </strong>
                        <span>
                          Add sample files to backend/sample_files and scan again.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span><ShieldCheck size={15} /> Preview only — your files have not been moved or renamed.</span>
            <span>{displayedFiles.length} shown</span>
          </div>
        </section>

        <footer className="footer">
          <span>Made with care and local AI.</span>
          <span>SlothSort · 2026</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
