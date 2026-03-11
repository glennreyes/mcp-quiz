/**
 * @file MCP Quiz app using MCP Apps SDK + React.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./mcp-app.module.css";

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface QuizPayload {
  step?: "selectDifficulty";
  questions?: QuizQuestion[];
}

function parseQuizPayload(callToolResult: CallToolResult): QuizPayload | null {
  const textContent = callToolResult.content?.find((c) => c.type === "text");
  if (!textContent || textContent.type !== "text") return null;
  try {
    return JSON.parse(textContent.text) as QuizPayload;
  } catch {
    return null;
  }
}

function QuizApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "MCP Quiz App", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => {
        console.info("App is being torn down");
        return {};
      };
      app.ontoolinput = async (input) => {
        console.info("Received tool call input:", input);
      };

      app.ontoolresult = async (result) => {
        console.info("Received tool call result:", result);
        setToolResult(result);
      };

      app.ontoolcancelled = (params) => {
        console.info("Tool call cancelled:", params.reason);
      };

      app.onerror = console.error;

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (error) return <div><strong>ERROR:</strong> {error.message}</div>;
  if (!app) return <div>Connecting...</div>;

  return (
    <QuizAppInner
      app={app}
      toolResult={toolResult}
      hostContext={hostContext}
      setToolResult={setToolResult}
    />
  );
}

interface QuizAppInnerProps {
  app: App;
  toolResult: CallToolResult | null;
  hostContext?: McpUiHostContext;
  setToolResult: (r: CallToolResult | null) => void;
}

function QuizAppInner({ app, toolResult, hostContext, setToolResult }: QuizAppInnerProps) {
  const payload = toolResult ? parseQuizPayload(toolResult) : null;
  const questions = payload?.questions ?? null;
  const step = payload?.step;
  const showDifficultyPicker =
    toolResult == null || step === "selectDifficulty";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, { chosen: number; correct: boolean }>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchQuizWithDifficulty = useCallback(
    async (difficulty: QuizDifficulty) => {
      setLoading(true);
      try {
        const result = await app.callServerTool({
          name: "mcp-quiz",
          arguments: { difficulty },
        });
        setToolResult(result);
        setCurrentIndex(0);
        setSelectedOption(null);
        setAnswers({});
        setFinished(false);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [app, setToolResult],
  );

  const handleSelectDifficulty = useCallback(
    (difficulty: QuizDifficulty) => {
      fetchQuizWithDifficulty(difficulty);
    },
    [fetchQuizWithDifficulty],
  );

  const handleSubmitAnswer = useCallback(() => {
    if (questions == null || selectedOption === null) return;
    const q = questions[currentIndex];
    const correct = selectedOption === q.correctIndex;
    setAnswers((prev) => ({ ...prev, [currentIndex]: { chosen: selectedOption, correct } }));
    setSelectedOption(null);
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [questions, currentIndex, selectedOption]);

  const handleRestart = useCallback(() => {
    setToolResult(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setFinished(false);
  }, [setToolResult]);

  const handleOpenMcpDocs = useCallback(async () => {
    await app.openLink({ url: "https://modelcontextprotocol.io/" });
  }, [app]);

  const safeAreaStyle = {
    paddingTop: hostContext?.safeAreaInsets?.top,
    paddingRight: hostContext?.safeAreaInsets?.right,
    paddingBottom: hostContext?.safeAreaInsets?.bottom,
    paddingLeft: hostContext?.safeAreaInsets?.left,
  };

  if (loading) {
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <p className={styles.intro}>Test your MCP knowledge</p>
        <div className={styles.action}>
          <p>Loading quiz...</p>
        </div>
      </main>
    );
  }

  if (showDifficultyPicker) {
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <p className={styles.intro}>Test your MCP knowledge</p>
        <h2 className={styles.scoreHeading}>Choose difficulty</h2>
        <div className={styles.difficultyPicker}>
          <button onClick={() => handleSelectDifficulty("easy")}>Easy</button>
          <button onClick={() => handleSelectDifficulty("medium")}>Medium</button>
          <button onClick={() => handleSelectDifficulty("hard")}>Hard</button>
        </div>
        <div className={styles.action}>
          <button onClick={handleOpenMcpDocs}>Open MCP docs</button>
        </div>
      </main>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <p className={styles.intro}>Test your MCP knowledge</p>
        <div className={styles.action}>
          <p>Could not load questions.</p>
          <button onClick={() => setToolResult(null)}>Choose difficulty again</button>
        </div>
        <div className={styles.action}>
          <button onClick={handleOpenMcpDocs}>Open MCP docs</button>
        </div>
      </main>
    );
  }

  if (finished) {
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const total = questions.length;
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <h2 className={styles.scoreHeading}>Quiz complete</h2>
        <p className={styles.score}>
          You got <strong>{correctCount} / {total}</strong> correct.
        </p>
        <div className={styles.action}>
          <button onClick={handleRestart}>Restart quiz</button>
        </div>
        <div className={styles.action}>
          <button onClick={handleOpenMcpDocs}>Open MCP docs</button>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];

  return (
    <main className={styles.main} style={safeAreaStyle}>
      <p className={styles.intro}>Test your MCP knowledge</p>
      <p className={styles.progress}>
        Question {currentIndex + 1} of {questions.length}
      </p>
      <div className={styles.questionBlock}>
        <h3 className={styles.questionText}>{q.question}</h3>
        <ul className={styles.optionsList} role="listbox" aria-label="Answer options">
          {q.options.map((opt, idx) => (
            <li key={idx}>
              <label className={styles.optionLabel}>
                <input
                  type="radio"
                  name="answer"
                  value={idx}
                  checked={selectedOption === idx}
                  onChange={() => setSelectedOption(idx)}
                  className={styles.optionRadio}
                />
                <span className={styles.optionText}>{opt}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.action}>
        <button
          onClick={handleSubmitAnswer}
          disabled={selectedOption === null}
        >
          Submit
        </button>
      </div>
      <div className={styles.action}>
        <button onClick={handleOpenMcpDocs}>Open MCP docs</button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QuizApp />
  </StrictMode>,
);
