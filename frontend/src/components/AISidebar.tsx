"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type { BoardData } from "@/lib/kanban";
import { sendAiRequest, type AIResponse } from "@/lib/aiApi";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AISidebarProps = {
  board: BoardData | null;
  onBoardUpdate: (board: BoardData) => void;
};

type SpeechRecognitionInstance = {
  start: () => void;
  stop: () => void;
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex?: number;
};

const createMessageId = () =>
  `msg-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

export const AISidebar = ({ board, onBoardUpdate }: AISidebarProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"info" | "success" | "warning">(
    "info"
  );
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const history = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const SpeechRecognition =
      (window as typeof window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }).SpeechRecognition ||
      (window as typeof window & {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
      }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    setSpeechSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const startIndex = event.resultIndex ?? 0;
      let transcript = "";
      for (let index = startIndex; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? "";
      }
      const nextValue = transcript.trim();
      if (nextValue) {
        setInput((prev) => (prev ? `${prev} ${nextValue}` : nextValue));
        setStatus("Voice input captured.");
        setStatusTone("success");
      }
    };
    recognition.onstart = () => {
      setStatus("Listening for voice input...");
      setStatusTone("info");
    };
    recognition.onerror = () => {
      setStatus("Voice input failed.");
      setStatusTone("warning");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setStatus((prev) => prev ?? "Voice input stopped.");
    };

    recognitionRef.current = recognition;
    return () => {
      recognition.stop();
    };
  }, []);

  useEffect(() => {
    if (!speechSupported) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.shiftKey || event.key.toLowerCase() !== "v") {
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        event.preventDefault();
        handleVoiceToggle();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [speechSupported, isListening, isSending, board]);

  const handleSubmit = async () => {
    if (!board || isSending) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    setInput("");
    setError(null);
    setStatus("Sending request...");
    setStatusTone("info");
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "user", content: trimmed },
    ]);

    try {
      const response = await sendAiRequest({
        question: trimmed,
        board,
        history,
      });
      handleAiResponse(response);
    } catch {
      setError("Unable to reach the assistant right now.");
      setStatus("Assistant request failed.");
      setStatusTone("warning");
    } finally {
      setIsSending(false);
    }
  };

  const handleAiResponse = (response: AIResponse) => {
    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "assistant", content: response.message },
    ]);

    const updatedBoard = response.updates?.board ?? null;
    if (updatedBoard) {
      onBoardUpdate(updatedBoard);
      setStatus("Board updated.");
      setStatusTone("success");
    } else {
      setStatus("Response ready.");
      setStatusTone("success");
    }
  };

  const handleVoiceToggle = () => {
    if (!recognitionRef.current || isSending || !board) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setStatus("Listening for voice input...");
    setStatusTone("info");
    recognitionRef.current.start();
  };

  const canSend = Boolean(board) && input.trim().length > 0 && !isSending;

  return (
    <aside className="rounded-[28px] border border-[var(--stroke)] bg-white/90 p-6 shadow-[var(--shadow)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
            AI Assistant
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--navy-dark)]">
            Board strategist
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
            Ask for edits, moves, or summaries. The assistant can update the board
            instantly.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--primary-blue)]">
            Ready
          </span>
          {speechSupported ? (
            <span className="rounded-full border border-[var(--stroke)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              Voice enabled
            </span>
          ) : null}
        </div>
      </div>

      {status ? (
        <div
          className={clsx(
            "mt-5 rounded-2xl border px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em]",
            statusTone === "success" &&
              "border-[var(--accent-yellow)] bg-[var(--accent-yellow)]/10 text-[var(--navy-dark)]",
            statusTone === "warning" &&
              "border-[var(--secondary-purple)]/50 bg-[var(--secondary-purple)]/10 text-[var(--navy-dark)]",
            statusTone === "info" &&
              "border-[var(--stroke)] bg-[var(--surface)] text-[var(--gray-text)]"
          )}
        >
          {status}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
          Conversation
        </p>
        <div className="mt-4 max-h-[320px] space-y-4 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--gray-text)]">
              No messages yet. Start with a request like "Move the review card
              to done.".
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={clsx(
                  "rounded-2xl px-4 py-3 text-sm leading-6",
                  message.role === "assistant"
                    ? "bg-white text-[var(--navy-dark)]"
                    : "bg-[var(--secondary-purple)]/10 text-[var(--navy-dark)]"
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                  {message.role === "assistant" ? "Assistant" : "You"}
                </p>
                <p className="mt-1">{message.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 text-sm font-semibold text-[var(--secondary-purple)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-5">
        <label className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
          Prompt
        </label>
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          rows={3}
          placeholder={
            board
              ? "Ask the assistant about this board"
              : "Loading board data..."
          }
          className="mt-2 w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
          disabled={!board || isSending}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[var(--gray-text)]">
            {isSending ? "Sending request..." : "Powered by OpenRouter"}
          </p>
          <div className="flex items-center gap-2">
            {speechSupported ? (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={!board || isSending}
                className={clsx(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
                  isListening
                    ? "border-[var(--primary-blue)] text-[var(--primary-blue)]"
                    : "border-[var(--stroke)] text-[var(--navy-dark)]",
                  (!board || isSending) && "cursor-not-allowed opacity-60"
                )}
                aria-pressed={isListening}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-current">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                    aria-hidden="true"
                  >
                    <path d="M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3Z" />
                    <path d="M6 11a6 6 0 0 0 12 0" />
                    <path d="M12 17v3" />
                  </svg>
                </span>
                {isListening ? "Listening" : "Voice"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              className="rounded-full bg-[var(--secondary-purple)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
