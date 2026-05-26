import type { BoardData } from "@/lib/kanban";

type AIMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type AIUpdate = {
  board: BoardData | null;
};

export type AIRequest = {
  question: string;
  board: BoardData;
  history: AIMessage[];
};

export type AIResponse = {
  message: string;
  updates?: AIUpdate | null;
};

const AI_ENDPOINT = "/api/ai";

export const sendAiRequest = async (payload: AIRequest) => {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("AI request failed");
  }

  return (await response.json()) as AIResponse;
};
