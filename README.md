# MCP Quiz

![Screenshot](screenshot.png)

An MCP App that provides an interactive quiz with a React UI.

## MCP Client Configuration

### Cursor

1. **Open MCP settings**: `Cmd + ,` (Mac) or `Ctrl + ,` (Windows/Linux) → **Features** → **MCP**.
2. **Edit config**: Click **Edit Config** to open your `mcp.json` (global: `~/.cursor/mcp.json`, or project: `.cursor/mcp.json`).
3. **Add the server** under `mcpServers` (replace `~/code/mcp-quiz` with your clone path):

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

4. Save and **reload** MCP (or restart Cursor).

You can also add it via the UI: **Add New MCP Server** → set the MCP server to command `bash`, args as above, transport **stdio**.

### VS Code

1. **Open MCP config**: Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **MCP: Open User Configuration** (user-wide) or **MCP: Open Workspace Folder MCP Configuration** (workspace only).
2. **Add the server** under `servers` (VS Code uses `servers`, not `mcpServers`). Include `"type": "stdio"` and replace `~/code/mcp-quiz` with your clone path:

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

3. Save the file. The server will be available in Copilot Chat and other MCP-aware features.

To add via UI: Command Palette → **MCP: Add Server**, then choose stdio and enter the MCP server command and args.

### Running from npm (if published)

If the package is installed globally or via `npx`, configure the MCP server as follows:

**Cursor** — MCP server with `"command": "npx"` and `"args": ["-y", "mcp-quiz", "--stdio"]`.

**VS Code** — MCP server with `"type": "stdio"`, `"command": "npx"`, `"args": ["-y", "mcp-quiz", "--stdio"]`.

## Overview

- MCP server that exposes a quiz tool with a linked React UI
- Tool registration with a linked UI resource
- React UI using the [`useApp()`](https://apps.extensions.modelcontextprotocol.io/api/functions/_modelcontextprotocol_ext-apps_react.useApp.html) hook
- App communication APIs: [`callServerTool`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#callservertool), [`sendMessage`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendmessage), [`sendLog`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendlog), [`openLink`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#openlink)

## Key Files

- [`server.ts`](server.ts) - MCP server with quiz tool and resource registration
- [`mcp-app.html`](mcp-app.html) / [`src/mcp-app.tsx`](src/mcp-app.tsx) - Quiz React UI using `useApp()` hook

## Getting Started

```bash
npm install
npm run dev
```

## How It Works

1. The server registers an MCP quiz tool with metadata linking it to a UI HTML resource (`ui://mcp-quiz/mcp-app.html`).
2. When the tool is invoked, the host renders the quiz UI from the resource.
3. The UI uses the MCP App SDK API to communicate with the host and call server tools (e.g. to submit answers and get results).

## Build System

The app bundles into a single HTML file using Vite with `vite-plugin-singlefile` — see [`vite.config.ts`](vite.config.ts). This allows all UI content to be served as a single MCP resource. Alternatively, MCP apps can load external resources by defining [`_meta.ui.csp.resourceDomains`](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiResourceCsp.html#resourcedomains) in the UI resource metadata.
