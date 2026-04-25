# AgentRegistry 2026 - Wiki

Welcome to the official documentation for **AgentRegistry 2026**.

## 🏗️ Architecture (MVC)

The project follows a strict **Model-View-Controller** pattern to ensure modularity and ease of maintenance.

### 💾 Model (`src/models/RegistryModel.ts`)
- Manages the core data structure (`AgentRegistry`).
- Handles path-based lookups (e.g., `root/CEO/Operations`).
- Emits events when data changes (`notify()`).
- Syncs state with the server via the `/api/save` endpoint.

### 🖼️ Views (`src/views/`)
- **TreeView**: Renders the hierarchical sidebar with auto-expanding logic.
- **AgentView**: Displays agent properties, sub-items, and quick actions.
- **FileView**: Handles raw content editing and file icons.
- **ModalView**: Manages the creation and editing popups.

### 🎮 Controller (`src/controllers/RegistryController.ts`)
- Orchestrates the interaction between Model and Views.
- Manages global state (Current Selection, Palette Visibility, Recent Items).
- Sets up keyboard shortcuts and event listeners.

---

## 🎨 UI & UX Guide

### Command Palette (`Ctrl + K`)
The Command Palette is the nervous system of the app.
1. Press `Ctrl + K`.
2. Type any part of an agent name or path.
3. Use `↑` / `↓` to select and `Enter` to jump directly to that agent.

### Dynamic Design Tokens
The UI uses a set of CSS variables (`:root` in `style.css`) that define the 2026 aesthetic:
- `--accent-color`: `#6366f1` (Indigo).
- `--glass-bg`: Semi-transparent layers with `backdrop-filter: blur(12px)`.
- `--shadow-xl`: Deep, soft shadows for floating elements like the Command Palette.

---

## 🛠️ API & Database

### `registry.json`
The database is a simple JSON file located in `public/`.
Structure:
```json
{
  "root": {
    "name": "Root Assistant",
    "type": "folder",
    "children": { ... }
  }
}
```

### Server API
- `POST /api/save`: Receives the full registry JSON and writes it to disk. 
  - **Dev**: Handled by Vite Middleware.
  - **Prod**: Handled by `server.js` (Express).

---

## 🐳 Deployment (CI/CD)

### GitHub Actions
The repo is configured with a CI pipeline (`.github/workflows/ci.yml`) that:
1. Validates the build.
2. Compiles Pug templates.
3. Verifies Docker image compatibility.

To add a CD (Continuous Deployment) step, you can extend this workflow to push the Docker image to **Docker Hub** or **GitHub Container Registry (GHCR)**.
