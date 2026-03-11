# 🧩 MCP Quiz

**An interactive quiz built as an MCP App** — runs inside Cursor, VS Code, or any MCP host with a rich React UI instead of plain text.

| | |
|---|---|
| **📦 Repo** | [github.com/glennreyes/mcp-quiz](https://github.com/glennreyes/mcp-quiz) |
| **📖 Description** | MCP server that exposes a **quiz** tool; when the tool is invoked, the host shows an embedded UI where users answer questions, get feedback, and see results. Built with [MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps) and React. |
| **🎤 Workshop** | [Building Interactive Chat Interfaces with MCP-UI](https://speakerdeck.com/glennreyes/dutch-ai-conference-building-interactive-chat-interfaces-with-mcp-ui) — Dutch AI Conference, Amsterdam (March 11, 2026). |

---

## 📡 MCP Client Configuration

The MCP server can be used in two ways: **HTTP** (server runs locally in a terminal; Cursor/VS Code connect to it) or **stdio** (Cursor/VS Code start the process). The HTTP variant is recommended for local development.

### 🖥️ Run the MCP server locally (required for HTTP)

The MCP server must be running on your machine before Cursor or VS Code can use it. In the project directory, run:

```bash
npm run build && npm run serve
```

Or use `npm run dev` to run with file watching. The server listens at **http://localhost:3001/mcp** (or the port set by `PORT`).

### 🔷 Cursor (HTTP)

1. **Open MCP settings**: `Cmd + ,` (Mac) or `Ctrl + ,` (Windows/Linux) → **Features** → **MCP**.
2. **Edit config**: Click **Edit Config** to open your `mcp.json` (global: `~/.cursor/mcp.json`, or project: `.cursor/mcp.json`).
3. **Add the server** under `mcpServers`:

```json
{
  "mcpServers": {
    "mcp-quiz": {
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

4. Save and **reload** MCP (or restart Cursor). Ensure the MCP server is already running locally (see above).

You can also add it via the UI: **Add New MCP Server** → choose HTTP/SSE and enter the URL above.

### 🔵 VS Code (HTTP)

1. **Open MCP config**: Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **MCP: Open User Configuration** (user-wide) or **MCP: Open Workspace Folder MCP Configuration** (workspace only).
2. **Add the server** under `servers` (VS Code uses `servers`, not `mcpServers`). The MCP server must be running locally (see above).

```json
{
  "servers": {
    "mcp-quiz": {
      "type": "http",
      "url": "http://localhost:3001/mcp"
    }
  }
}
```

3. Save the file. The server will be available in Copilot Chat and other MCP-aware features.

To add via UI: Command Palette → **MCP: Add Server**, then choose HTTP and enter the MCP server URL.

### ⚙️ Optional: stdio (client starts the process)

If you prefer Cursor/VS Code to start the MCP server process instead of connecting to a running server, use stdio. Replace `~/code/mcp-quiz` with your clone path.

**Cursor** (`mcp.json` → `mcpServers`):

```json
{
  "mcpServers": {
    "mcp-quiz": {
      "command": "bash",
      "args": [
        "-c",
        "cd ~/code/mcp-quiz && npm run build >&2 && node dist/index.js --stdio"
      ]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json` or user config → `servers`):

```json
{
  "servers": {
    "mcp-quiz": {
      "type": "stdio",
      "command": "bash",
      "args": [
        "-c",
        "cd ~/code/mcp-quiz && npm run build >&2 && node dist/index.js --stdio"
      ]
    }
  }
}
```

### 📦 Running from npm (if published)

If the package is installed globally or via `npx`, configure the MCP server as follows:

**Cursor** — MCP server with `"command": "npx"` and `"args": ["-y", "mcp-quiz", "--stdio"]`.

**VS Code** — MCP server with `"type": "stdio"`, `"command": "npx"`, `"args": ["-y", "mcp-quiz", "--stdio"]`.

## 🏗️ Architecture

```
┌─────────────────┐     stdio / HTTP      ┌──────────────────────────────────┐
│  MCP Host       │ ◄──────────────────►  │  MCP Server (this repo)           │
│  (Cursor,       │                        │  • Registers quiz tool             │
│   VS Code,      │                        │  • Serves UI resource (HTML)       │
│   Claude, etc.) │                        │  • Handles tool calls (submit,     │
└────────┬────────┘                        │    get questions, results)         │
         │                                 └───────────────┬────────────────────┘
         │ request UI resource / call tools                │
         │                                                 │ reads bundle
         ▼                                                 ▼
┌─────────────────┐                        ┌──────────────────────────────────┐
│  Embedded UI    │   fetch ui://mcp-quiz  │  mcp-app.html (single-file bundle) │
│  (iframe)       │ ◄─────────────────────│  React app via useApp() ↔ host    │
│  Quiz UI        │                        │  & callServerTool() ↔ server       │
└─────────────────┘                        └──────────────────────────────────┘
```

- **Host** talks to the **MCP server** over stdio or HTTP. The server declares a **tool** (e.g. “run quiz”) with `_meta.ui.resourceUri` pointing to a **UI resource**.
- When the user (or AI) invokes the tool, the **host** fetches that resource from the server and renders it in a sandboxed **iframe**. The **UI** then uses the MCP App SDK to call back to the server (e.g. submit answers, fetch questions) and to the host (e.g. send messages, open links).

## 📋 Overview

- **MCP server** that exposes a quiz tool with a linked React UI.
- **Tool + resource registration**: one tool, one UI resource URI (`ui://mcp-quiz/mcp-app.html`).
- **React UI** using the [`useApp()`](https://apps.extensions.modelcontextprotocol.io/api/functions/_modelcontextprotocol_ext-apps_react.useApp.html) hook to talk to the host and [`callServerTool`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#callservertool) to talk to the server.
- Other app APIs: [`sendMessage`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendmessage), [`sendLog`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendlog), [`openLink`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#openlink).

## 📁 Key Files

| File | Purpose |
|------|--------|
| [`server.ts`](server.ts) | MCP server: quiz tool registration, UI resource, handlers for questions/submit/results. |
| [`mcp-app.html`](mcp-app.html) / [`src/mcp-app.tsx`](src/mcp-app.tsx) | Quiz React UI (entry HTML + React app using `useApp()`). |
| [`quiz-data.ts`](quiz-data.ts) | Quiz questions and answers (used by the server). |

## 🚀 Getting Started

```bash
npm install
npm run dev
```

This starts the HTTP MCP server (default `http://localhost:3001/mcp`) and, in dev, watches the UI bundle. Use the [MCP Client Configuration](#-mcp-client-configuration) above to connect Cursor or VS Code.

## 🔄 How It Works

1. **Server** registers an MCP **quiz** tool with metadata linking it to the UI resource `ui://mcp-quiz/mcp-app.html`.
2. When the tool is **invoked** (by the user or the AI in the host), the **host** requests that resource from the server and renders the returned HTML in an iframe.
3. The **quiz UI** loads in the iframe, uses `useApp()` to get the app API, and calls **server tools** (e.g. “get questions”, “submit answers”, “show results”) via `callServerTool()`. The server responds with data; the UI updates and can send messages or open links through the host.

## 📦 Build System

The UI is bundled into a **single HTML file** with Vite and `vite-plugin-singlefile` — see [`vite.config.ts`](vite.config.ts). That file is what the server serves as the UI resource, so no extra static hosting is needed. For loading external assets, MCP apps can set [`_meta.ui.csp.resourceDomains`](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiResourceCsp.html#resourcedomains) in the tool’s UI metadata.

## 📚 References

- 🧩 **[Model Context Protocol (MCP)](https://modelcontextprotocol.io)** — Official site and [specification](https://modelcontextprotocol.io/specification/latest)
- 🖼️ **[MCP Apps](https://modelcontextprotocol.io/docs/extensions/apps)** — Interactive UIs for MCP tools (docs and [API](https://modelcontextprotocol.github.io/ext-apps/api/))
- 💬 **[MCP-UI](https://mcpui.dev/)** — [Introduction to MCP-UI](https://mcpui.dev/guide/introduction.html) and tooling for building interactive chat interfaces with MCP
