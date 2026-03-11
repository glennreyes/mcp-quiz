# Example: Basic Server (React)

![Screenshot](screenshot.png)

An MCP App example with a React UI.

> [!TIP]
> Looking for a vanilla JavaScript example? See [`basic-server-vanillajs`](https://github.com/modelcontextprotocol/ext-apps/tree/main/examples/basic-server-vanillajs)!

## MCP Client Configuration

### Cursor

1. **Open MCP settings**: `Cmd + ,` (Mac) or `Ctrl + ,` (Windows/Linux) → **Features** → **MCP**.
2. **Edit config**: Click **Edit Config** to open your `mcp.json` (global: `~/.cursor/mcp.json`, or project: `.cursor/mcp.json`).
3. **Add the server** under `mcpServers`:

```json
{
  "mcpServers": {
    "basic-react": {
      "command": "npx",
      "args": [
        "-y",
        "--silent",
        "--registry=https://registry.npmjs.org/",
        "@modelcontextprotocol/server-basic-react",
        "--stdio"
      ]
    }
  }
}
```

4. Save and **reload** MCP (or restart Cursor).

You can also add it via the UI: **Add New MCP Server** → enter command `npx`, args as above, transport **stdio**.

### VS Code

1. **Open MCP config**: Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) → **MCP: Open User Configuration** (user-wide) or **MCP: Open Workspace Folder MCP Configuration** (workspace only).
2. **Add the server** under `servers` (VS Code uses `servers`, not `mcpServers`). Include `"type": "stdio"` for local servers:

```json
{
  "servers": {
    "basic-react": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "--silent",
        "--registry=https://registry.npmjs.org/",
        "@modelcontextprotocol/server-basic-react",
        "--stdio"
      ]
    }
  }
}
```

3. Save the file. The server will be available in Copilot Chat and other MCP-aware features.

To add via UI: Command Palette → **MCP: Add Server**, then choose stdio and enter command/args.

### Local Development

To test local modifications, use this configuration (replace `~/code/ext-apps` with your clone path).

**Cursor** (`mcp.json` → `mcpServers`):

```json
{
  "mcpServers": {
    "basic-react": {
      "command": "bash",
      "args": [
        "-c",
        "cd ~/code/ext-apps/examples/basic-server-react && npm run build >&2 && node dist/index.js --stdio"
      ]
    }
  }
}
```

**VS Code** (`.vscode/mcp.json` or user config → `servers`):

```json
{
  "servers": {
    "basic-react": {
      "type": "stdio",
      "command": "bash",
      "args": [
        "-c",
        "cd ~/code/ext-apps/examples/basic-server-react && npm run build >&2 && node dist/index.js --stdio"
      ]
    }
  }
}
```

## Overview

- Tool registration with a linked UI resource
- React UI using the [`useApp()`](https://apps.extensions.modelcontextprotocol.io/api/functions/_modelcontextprotocol_ext-apps_react.useApp.html) hook
- App communication APIs: [`callServerTool`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#callservertool), [`sendMessage`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendmessage), [`sendLog`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#sendlog), [`openLink`](https://apps.extensions.modelcontextprotocol.io/api/classes/app.App.html#openlink)

## Key Files

- [`server.ts`](server.ts) - MCP server with tool and resource registration
- [`mcp-app.html`](mcp-app.html) / [`src/mcp-app.tsx`](src/mcp-app.tsx) - React UI using `useApp()` hook

## Getting Started

```bash
npm install
npm run dev
```

## How It Works

1. The server registers a `get-time` tool with metadata linking it to a UI HTML resource (`ui://get-time/mcp-app.html`).
2. When the tool is invoked, the Host renders the UI from the resource.
3. The UI uses the MCP App SDK API to communicate with the host and call server tools.

## Build System

This example bundles into a single HTML file using Vite with `vite-plugin-singlefile` — see [`vite.config.ts`](vite.config.ts). This allows all UI content to be served as a single MCP resource. Alternatively, MCP apps can load external resources by defining [`_meta.ui.csp.resourceDomains`](https://apps.extensions.modelcontextprotocol.io/api/interfaces/app.McpUiResourceCsp.html#resourcedomains) in the UI resource metadata.
