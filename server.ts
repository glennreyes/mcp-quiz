import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { MCP_QUIZ_QUESTIONS } from "./quiz-data.js";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Basic MCP App Server (React)",
    version: "1.0.0",
  });

  // Two-part registration: tool + resource, tied together by the resource URI.
  const resourceUri = "ui://mcp-quiz/mcp-app.html";

  // Register a tool with UI metadata. When the host calls this tool, it reads
  // `_meta.ui.resourceUri` to know which resource to fetch and render as an
  // interactive UI.
  registerAppTool(server,
    "mcp-quiz",
    {
      title: "MCP Quiz",
      description: "Start an interactive quiz about the Model Context Protocol (MCP).",
      inputSchema: {
        difficulty: z
          .enum(["easy", "medium", "hard"])
          .optional()
          .describe("Quiz difficulty level. Omit to show the difficulty picker."),
      },
      _meta: { ui: { resourceUri } }, // Links this tool to its UI resource
    },
    async (args: { difficulty?: "easy" | "medium" | "hard" }): Promise<CallToolResult> => {
      if (args?.difficulty == null) {
        const payload = JSON.stringify({ step: "selectDifficulty" });
        return { content: [{ type: "text", text: payload }] };
      }
      const questions = MCP_QUIZ_QUESTIONS.filter((q) => q.difficulty === args.difficulty);
      const payload = JSON.stringify({ questions });
      return { content: [{ type: "text", text: payload }] };
    },
  );

  // Register the resource, which returns the bundled HTML/JavaScript for the UI.
  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
