/**
 * @file MCP Quiz app – Tailwind + shadcn-style, theming, hints, confetti.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import * as Progress from "@radix-ui/react-progress";
import * as RadioGroup from "@radix-ui/react-radio-group";
import confetti from "canvas-confetti";
import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { cn } from "./lib/utils";

export type QuizDifficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
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

  if (error) return <div className="p-4 text-destructive"><strong>ERROR:</strong> {error.message}</div>;
  if (!app) return <div className="p-4 text-muted-foreground">Connecting…</div>;

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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, { chosen: number; correct: boolean }>>({});
  const [hintRevealed, setHintRevealed] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultsRequestSentRef = useRef(false);
  const confettiFiredRef = useRef(false);

  const payload = toolResult ? parseQuizPayload(toolResult) : null;
  const questions = payload?.questions ?? null;
  const step = payload?.step;
  const showDifficultyPicker = toolResult == null || step === "selectDifficulty";
  const showResultsView = step === "results";

  useEffect(() => {
    if (hostContext?.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [hostContext?.theme]);

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

  const resultsAllCorrect = showResultsView && payload?.correctCount != null && payload?.totalCount != null && payload.correctCount === payload.totalCount;
  useEffect(() => {
    if (resultsAllCorrect && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      const duration = 2_000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#22c55e", "#3b82f6", "#eab308"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#22c55e", "#3b82f6", "#eab308"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
  }, [resultsAllCorrect]);

  const handleSelectDifficulty = useCallback(
    async (difficulty: QuizDifficulty) => {
      setLoading(true);
      setToolResult(null);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswers({});
      setHintRevealed(new Set());
      setFinished(false);
      try {
        await app.sendMessage({
          role: "user",
          content: [
            {
              type: "text",
              text: `The user selected quiz difficulty: **${difficulty}**. Generate 5 new quiz questions about the Model Context Protocol (MCP) for ${difficulty} difficulty. Each question must have: \`id\` (string, e.g. "q1"), \`question\` (string), \`options\` (array of exactly 4 strings), \`correctIndex\` (number 0–3), and an optional \`hint\` (string) to help the player. Then call the **mcp-quiz** tool with \`difficulty\` "${difficulty}" and \`questions\` (array of 5 objects) so they appear in the quiz UI.`,
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
    const idx = Number(selectedOption);
    const q = questions[currentIndex];
    const correct = idx === q.correctIndex;
    setAnswers((prev) => ({ ...prev, [currentIndex]: { chosen: idx, correct } }));
    setSelectedOption(null);
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setHintRevealed((prev) => new Set(prev));
    }
  }, [questions, currentIndex, selectedOption]);

  const revealHint = useCallback(() => {
    setHintRevealed((prev) => new Set(prev).add(currentIndex));
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    resultsRequestSentRef.current = false;
    confettiFiredRef.current = false;
    setToolResult(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswers({});
    setHintRevealed(new Set());
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
      <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
        <p className="text-lg font-medium text-foreground">Test your MCP knowledge</p>
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground">Generating questions… The agent will create a quiz and it will appear here.</p>
        </div>
      </main>
    );
  }

  if (showDifficultyPicker) {
    return (
      <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">MCP Quiz</h1>
          <p className="text-muted-foreground mt-1">Test your Model Context Protocol knowledge</p>
        </div>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Choose difficulty</h2>
          <div className="flex flex-col gap-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => handleSelectDifficulty(d)}
                className={cn(
                  "w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium",
                  "hover:bg-accent hover:text-accent-foreground transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                )}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleOpenMcpDocs}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Open MCP docs
        </button>
      </main>
    );
  }

  if (showResultsView && payload?.correctCount != null && payload?.totalCount != null) {
    const correctCount = payload.correctCount;
    const totalCount = payload.totalCount;
    const allCorrect = correctCount === totalCount;
    const illustration = payload.illustration
      ? payload.illustration.startsWith("data:")
        ? payload.illustration
        : `data:image/png;base64,${payload.illustration}`
      : null;

    return (
      <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            {allCorrect ? "🎉 Perfect!" : "Quiz complete"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            You got <strong className="text-foreground">{correctCount} / {totalCount}</strong> correct.
          </p>
          {illustration ? (
            <div className="mt-4 rounded-lg overflow-hidden bg-muted/50">
              <img src={illustration} alt="Reward" className="w-full h-auto object-contain max-h-48" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleRestart}
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Play again
          </button>
          <button onClick={handleOpenMcpDocs} className="text-sm text-muted-foreground hover:text-foreground underline">
            Open MCP docs
          </button>
        </div>
      </main>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
        <p className="text-lg font-medium text-foreground">Test your MCP knowledge</p>
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground">Could not load questions.</p>
          <button
            onClick={() => setToolResult(null)}
            className="mt-4 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
          >
            Choose difficulty again
          </button>
        </div>
        <button onClick={handleOpenMcpDocs} className="text-sm text-muted-foreground hover:text-foreground underline">
          Open MCP docs
        </button>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
        <p className="text-lg font-medium text-foreground">Test your MCP knowledge</p>
        <div className="rounded-lg border bg-card p-6 text-card-foreground">
          <p className="text-muted-foreground">Generating your reward… The agent will create an illustration based on your score.</p>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const showHint = q.hint && hintRevealed.has(currentIndex);

  return (
    <main className="min-h-screen w-full max-w-md mx-auto p-4 flex flex-col gap-6" style={safeAreaStyle}>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">MCP Quiz</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <Progress.Root value={progress} className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <Progress.Indicator
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </Progress.Root>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm flex-1 flex flex-col gap-4">
        <h3 className="text-lg font-semibold leading-tight">{q.question}</h3>

        <RadioGroup.Root
          value={selectedOption ?? ""}
          onValueChange={setSelectedOption}
          className="flex flex-col gap-2"
        >
          {q.options.map((opt, idx) => (
            <label
              key={idx}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors",
                "hover:bg-accent/50",
                selectedOption === String(idx) && "border-primary bg-accent/50 ring-2 ring-ring ring-offset-2",
              )}
            >
              <RadioGroup.Item value={String(idx)} id={`opt-${idx}`} className="mt-0.5 h-4 w-4 rounded-full border border-primary text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2" />
              <span className="text-sm font-medium leading-tight">{opt}</span>
            </label>
          ))}
        </RadioGroup.Root>

        {q.hint && !showHint && (
          <button
            type="button"
            onClick={revealHint}
            className="text-sm text-muted-foreground hover:text-foreground underline text-left"
          >
            💡 Reveal hint
          </button>
        )}
        {showHint && q.hint && (
          <div className="rounded-lg bg-muted/80 p-3 text-sm text-muted-foreground border border-border">
            <span className="font-medium text-foreground">Hint:</span> {q.hint}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleSubmitAnswer}
          disabled={selectedOption === null}
          className={cn(
            "w-full rounded-lg bg-primary text-primary-foreground px-4 py-3 text-sm font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedOption === null ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
          )}
        >
          Submit
        </button>
        <button onClick={handleOpenMcpDocs} className="text-sm text-muted-foreground hover:text-foreground underline">
          Open MCP docs
        </button>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QuizApp />
  </StrictMode>,
);
