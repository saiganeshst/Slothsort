# SlothSort 🦥

**A local-first AI file organizer that helps you classify files and preview a cleaner folder structure before making changes.**

SlothSort uses a local Ollama model to suggest categories for files based on their filenames and extensions. The current MVP supports safe folder scanning, batch AI classification, uncertainty flags, and manual category editing. It is **preview-only**: it does not move, rename, or delete files.

## Features

- **Safe sample-folder scanning** — scans files directly inside `backend/sample_files`.
- **Local AI classification** — uses Ollama with `qwen2.5:1.5b` by default.
- **Batch preview** — sends scanned filenames to the model in one request.
- **Uncertainty handling** — flags low-confidence or fallback suggestions for review.
- **Manual category editing** — change suggested categories in the dashboard.
- **Review-before-action design** — shows proposed destination folders without applying changes.
- **React dashboard** — view files, categories, file sizes, AI status, and suggested destinations.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Lucide React
- **Backend:** Python, FastAPI, Uvicorn, HTTPX
- **Local inference:** Ollama
- **Default model:** Qwen 2.5 1.5B (`qwen2.5:1.5b`)

## Requirements

- Python 3
- Node.js and npm
- [Ollama](https://ollama.com/)
- Git (optional)

Pull the default model:

```powershell
ollama pull qwen2.5:1.5b
```

Make sure Ollama is running locally before generating an AI preview.

## Project Structure

```text
SlothSort/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── sample_files/
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── ...
│   ├── package.json
│   └── ...
├── .venv/             # local only; do not commit
└── README.md
```

## Setup on Windows

### 1. Open the project

If cloning from GitHub:

```powershell
git clone YOUR_REPOSITORY_URL
cd SlothSort
```

If you already have the project locally, open PowerShell in the project root.

### 2. Create and activate the Python environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, you can use the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 3. Install backend dependencies

```powershell
python -m pip install -r backend\requirements.txt
```

`backend/requirements.txt` should contain:

```text
fastapi
uvicorn[standard]
httpx
```

### 4. Install frontend dependencies

```powershell
cd frontend
npm install
npm install lucide-react
cd ..
```

### 5. Prepare sample files

Place safe test files in `backend/sample_files/`. Or run these commands from the project root:

```powershell
Set-Content backend/sample_files/meeting-notes.txt "Sample meeting notes"
Set-Content backend/sample_files/todo.py "print('hello')"
Set-Content backend/sample_files/project-plan.md "# Sample project plan"
```

The scanner reads file metadata only; it does not read the contents of these files.

## Run SlothSort

Open two PowerShell terminals from the project root.

### Terminal 1: Start the backend

```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000 --app-dir backend
```

Backend URLs:

- API root: <http://localhost:8000/>
- Health check: <http://localhost:8000/api/health>
- Interactive API docs: <http://localhost:8000/docs>

### Terminal 2: Start the frontend

```powershell
cd frontend
npm run dev
```

Open the URL Vite prints, usually <http://localhost:5173/>.

## How to Use It

1. Start Ollama and make sure `qwen2.5:1.5b` is available.
2. Start the backend and frontend.
3. Open the SlothSort dashboard.
4. Add a few safe test files to `backend/sample_files/`.
5. Click **Scan files** or refresh the scan.
6. Click **Generate AI preview** to classify filenames in a batch.
7. Review each category, explanation, and proposed destination.
8. Use the category dropdown to correct suggestions.
9. Confirm the original files remain unchanged.

Manual category edits currently exist in frontend state only. They are not persisted to the backend or saved between page reloads.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Basic API status |
| `GET` | `/api/health` | Checks backend and Ollama availability and whether the configured model is installed |
| `GET` | `/api/scan` | Scans the dedicated sample folder and returns file metadata |
| `POST` | `/api/preview` | Generates a batch AI classification preview without changing files |

The preview response includes `suggested_category`, `destination_folder`, `reason`, `confidence`, `needs_review`, and `classification_source`. The backend reports `changes_applied: false`. This MVP has no file-move, rename, or delete endpoint.

## Safety and Privacy Notes

- The backend scans only the dedicated `backend/sample_files/` folder.
- The scanner inspects regular files directly inside that folder and does not recursively scan subdirectories.
- Symbolic links are skipped.
- File contents are not read or sent to Ollama; the classification prompt contains filenames and extensions.
- Local inference uses Ollama at `http://localhost:11434` by default.
- Model-generated categories are validated against an allowlist.
- Low-confidence or malformed model responses fall back to extension-based classification and are flagged for review.
- Model-reported confidence is a heuristic, not a calibrated probability of correctness.
- This is a local development prototype, not a security-audited production application. Do not expose the API publicly without additional security work.

## Current Limitations

- Scans at most 50 files per request.
- Skips files larger than 100 MB.
- Scans only the top level of the sample folder.
- Classifies using filenames and extensions, not document contents.
- AI quality and speed depend on the model and available hardware.
- Manual category changes are not persisted.
- Actual file moves, renames, undo, and transaction logging are not implemented yet.
- The frontend currently uses `http://localhost:8000`.
- The stylesheet may load Google Fonts over the internet; use system fonts if you want the UI to avoid that external request.

## Roadmap

- [x] Safe sample-folder scanning
- [x] Local Ollama integration
- [x] Batch classification preview
- [x] Uncertainty and fallback indicators
- [x] Manual category editing in the UI
- [ ] Persist review decisions
- [ ] Add safe file operations with explicit confirmation
- [ ] Add destination collision protection
- [ ] Add transaction log and undo support
- [ ] Expand automated tests and edge-case handling
- [ ] Package the app for easier local installation

## Contributing

Contributions and feedback are welcome. For file-operation changes, prioritize safety, explicit user confirmation, path validation, collision handling, and recoverability.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change and test it locally.
4. Open a pull request describing the change and tests performed.

## License

No license has been specified yet. Add a `LICENSE` file before presenting the project as open-source software, and choose a license appropriate for the project and its dependencies.
