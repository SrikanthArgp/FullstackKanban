import type { BoardData } from "@/lib/kanban";

const BOARD_ENDPOINT = "/api/board";

const parseJson = async (response: Response) => {
  if (!response.ok) {
    throw new Error("Request failed");
  }
  return (await response.json()) as BoardData;
};

export const getBoard = async () => {
  const response = await fetch(BOARD_ENDPOINT, { cache: "no-store" });
  return parseJson(response);
};

export const saveBoard = async (board: BoardData) => {
  const response = await fetch(BOARD_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(board),
  });
  return parseJson(response);
};
