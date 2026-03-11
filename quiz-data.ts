/**
 * Static quiz questions about MCP (Model Context Protocol).
 */

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: QuizDifficulty;
}

export const MCP_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "What does MCP stand for?",
    options: [
      "Model Context Protocol",
      "Machine Communication Protocol",
      "Modular Context Provider",
      "Model Configuration Protocol",
    ],
    correctIndex: 0,
    difficulty: "easy",
  },
  {
    id: "q2",
    question: "Which of the following are first-class concepts in MCP?",
    options: [
      "Tools and resources only",
      "Tools, resources, and prompts",
      "Only tools",
      "Only resources",
    ],
    correctIndex: 1,
    difficulty: "medium",
  },
  {
    id: "q3",
    question: "What protocol does MCP use for communication?",
    options: [
      "REST over HTTP",
      "GraphQL",
      "JSON-RPC 2.0",
      "gRPC",
    ],
    correctIndex: 2,
    difficulty: "easy",
  },
  {
    id: "q4",
    question: "Which transport is commonly used for local MCP servers?",
    options: [
      "WebSocket only",
      "HTTP only",
      "stdio (standard input/output)",
      "gRPC streaming",
    ],
    correctIndex: 2,
    difficulty: "medium",
  },
  {
    id: "q5",
    question: "What is an MCP resource typically used for?",
    options: [
      "Executing actions on the server",
      "Providing read-only content (e.g. documents, templates) to the client",
      "Sending prompts to an LLM",
      "Storing session state",
    ],
    correctIndex: 1,
    difficulty: "medium",
  },
  {
    id: "q6",
    question: "What is an MCP tool used for?",
    options: [
      "Serving static files only",
      "Letting the client request the server to perform an action and return a result",
      "Streaming logs only",
      "Authentication only",
    ],
    correctIndex: 1,
    difficulty: "medium",
  },
  {
    id: "q7",
    question: "Which component typically runs the MCP server?",
    options: [
      "The LLM only",
      "The host application (e.g. IDE, CLI) only",
      "A separate process or service that the host connects to",
      "The browser only",
    ],
    correctIndex: 2,
    difficulty: "hard",
  },
  {
    id: "q8",
    question: "How does a client typically discover MCP server capabilities?",
    options: [
      "By reading a config file only",
      "Through an initial handshake (initialize request)",
      "By probing each endpoint",
      "Capabilities are fixed and documented externally",
    ],
    correctIndex: 1,
    difficulty: "easy",
  },
  {
    id: "q9",
    question: "Can an MCP server expose both tools and resources?",
    options: [
      "No, it must choose one",
      "Yes, a server can expose any combination",
      "Only if using HTTP transport",
      "Only tools are allowed with resources",
    ],
    correctIndex: 1,
    difficulty: "hard",
  },
  {
    id: "q10",
    question: "When a tool call fails on the server, how is the client informed?",
    options: [
      "The connection is closed",
      "An error response is returned in the JSON-RPC reply",
      "The client must poll for status",
      "Tools cannot fail",
    ],
    correctIndex: 1,
    difficulty: "hard",
  },
];
