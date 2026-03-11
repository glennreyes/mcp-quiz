/**
 * @file MCP Quiz app using MCP Apps SDK + React.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
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
  step?: "selectDifficulty" | "results";
  questions?: QuizQuestion[];
  correctCount?: number;
  totalCount?: number;
  illustration?: string;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, { chosen: number; correct: boolean }>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultsRequestSentRef = useRef(false);

  const payload = toolResult ? parseQuizPayload(toolResult) : null;
  const questions = payload?.questions ?? null;
  const step = payload?.step;
  const showDifficultyPicker =
    toolResult == null || step === "selectDifficulty";
  const showResultsView = step === "results";

  useEffect(() => {
    if (loading && toolResult) {
      const p = parseQuizPayload(toolResult);
      const hasQuestions = p?.questions != null;
      const hasError = (p as { error?: unknown })?.error != null || (toolResult as { isError?: boolean })?.isError === true;
      if (hasQuestions || hasError) {
        setLoading(false);
      }
    }
  }, [loading, toolResult]);

  useEffect(() => {
    if (!finished || !questions?.length || resultsRequestSentRef.current || !app) return;
    const correctCount = Object.values(answers).filter((a) => a.correct).length;
    const totalCount = questions.length;
    resultsRequestSentRef.current = true;
    app.sendMessage({
      role: "user",
      content: [
        {
          type: "text",
          text: `The user just completed the MCP quiz with **${correctCount} / ${totalCount}** correct. Generate a short, rewarding illustration (single image) based on how well they did: celebrate a strong score, or encourage them gently for a lower score. Then call the **mcp-quiz** tool with: \`step\` "results", \`correctCount\` ${correctCount}, \`totalCount\` ${totalCount}, and \`illustration\` as a data URL (e.g. \`data:image/png;base64,...\`) or base64 string of the image so it appears in the quiz UI.`,
        },
      ],
    }).catch(console.error);
  }, [finished, questions?.length, answers, app]);

  const handleSelectDifficulty = useCallback(
    async (difficulty: QuizDifficulty) => {
      setLoading(true);
      setToolResult(null);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswers({});
      setFinished(false);
      try {
        await app.sendMessage({
          role: "user",
          content: [
            {
              type: "text",
              text: `The user selected quiz difficulty: **${difficulty}**. Generate 5 new quiz questions about the Model Context Protocol (MCP) for ${difficulty} difficulty. Then call the **mcp-quiz** tool with exactly two arguments: \`difficulty\` (string "${difficulty}") and \`questions\` (array of 5 objects). Each question must have: \`id\` (string, e.g. "q1"), \`question\` (string), \`options\` (array of exactly 4 strings), \`correctIndex\` (number 0–3). Call the tool so the questions appear in the quiz UI.`,
            },
          ],
        });
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    },
    [app, setToolResult],
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
    resultsRequestSentRef.current = false;
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
          <p>Generating questions… The agent will create a quiz and it will appear here.</p>
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

  if (showResultsView && payload?.correctCount != null && payload?.totalCount != null) {
    const correctCount = payload.correctCount;
    const totalCount = payload.totalCount;
    const illustration = payload.illustration
      ? payload.illustration.startsWith("data:")
        ? payload.illustration
        : `data:image/png;base64,${payload.illustration}`
      : null;
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <h2 className={styles.scoreHeading}>Quiz complete</h2>
        <p className={styles.score}>
          You got <strong>{correctCount} / {totalCount}</strong> correct.
        </p>
        {illustration ? (
          <div className={styles.resultsIllustration}>
            <img src={illustration} alt="Reward" className={styles.resultsImage} />
          </div>
        ) : null}
        <div className={styles.action}>
          <button onClick={handleRestart}>Restart quiz</button>
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
    return (
      <main className={styles.main} style={safeAreaStyle}>
        <p className={styles.intro}>Test your MCP knowledge</p>
        <div className={styles.action}>
          <p>Generating your reward… The agent will create an illustration based on your score.</p>
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
