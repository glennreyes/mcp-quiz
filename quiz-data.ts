/**
 * Static quiz questions about MCP (Model Context Protocol).
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
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
  },
];
