# AgentRegistry 2026

![Agent Registry UI](https://github.com/Z23599848/agentasfile/raw/master/src/assets/hero.png)

**AgentRegistry 2026** is a high-performance, autonomous multi-agent management system built with a focus on "Invisible AI" principles and "Strategic Density" design. It behaves like a hierarchical folder system where every folder is a smart agent (assistant) and every file is a context or configuration.

## ✨ Features

- **2026 Premium UI**: Notion-inspired aesthetics with glassmorphism, fluid animations, and a focus on visual hierarchy.
- **Command Palette (`Ctrl + K`)**: Rapidly search, navigate, and trigger actions across your entire agent network.
- **MVC Architecture**: Robust separation of concerns (Model-View-Controller) for scalability and ease of extension.
- **Pug Templates**: Clean, semantic templating for high-performance rendering.
- **Hierarchical Persistence**: Automatically nests agents under the `root` orchestrator, preserving context and discovery.
- **Dynamic Dashboards**: Auto-generated property cards (role, tools, secrets, behavior) for every agent.
- **MCP Integration**: Connect your agents to the **Model Context Protocol**. Assign capabilities like Filesystem, GitHub, or Browser automation to specific agents.
- **Global MCP Manager**: Centralized management for all your MCP server configurations.

## 🚀 Quick Start

### Using Docker (Recommended)

Run the entire system with a single command:

```bash
docker build -t agent-registry .
docker run -p 3000:3000 agent-registry
```

Then visit [http://localhost:3000](http://localhost:3000)

### Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Dev Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## ⌨️ Keyboard Shortcuts

- **`Ctrl + K`**: Open Command Palette
- **`N`**: New Agent (in current folder)
- **`F`**: New File (in current folder)
- **`Esc`**: Close modals or palette
- **`↑ / ↓`**: Navigate palette results

## 📂 Project Structure

- `/src/models`: Data handling and persistence logic.
- `/src/views`: UI rendering components (AgentView, FileView, TreeView).
- `/src/controllers`: Event handling and state management.
- `/public`: Static assets and the `registry.json` database.
- `index.pug`: Main application template.

## 🛠️ Configuration

The system persists its state to `public/registry.json`. In a production environment, you may want to mount this file as a volume to ensure data persistence across container restarts.

---
Built with ❤️ for the future of Autonomous Multi-Agent Organizations.
