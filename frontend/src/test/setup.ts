import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { initialData, type BoardData } from "@/lib/kanban";

const cloneBoard = (data: BoardData) =>
	JSON.parse(JSON.stringify(data)) as BoardData;

beforeEach(() => {
	let boardState = cloneBoard(initialData);

	const mockFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const method = (init?.method ?? "GET").toUpperCase();
		const requestUrl =
			typeof input === "string"
				? input
				: input instanceof URL
					? input.toString()
					: input.url;

		if (requestUrl.endsWith("/api/ai") && method === "POST") {
			const nextBoard = {
				...boardState,
				columns: boardState.columns.map((column, index) =>
					index === 0 ? { ...column, title: "AI Updated" } : column
				),
			};
			boardState = cloneBoard(nextBoard);
			return {
				ok: true,
				json: async () => ({
					message: "Updated the board.",
					updates: { board: cloneBoard(nextBoard) },
				}),
			} as Response;
		}

		if (method === "PUT" && init?.body) {
			boardState = JSON.parse(String(init.body)) as BoardData;
		}

		return {
			ok: true,
			json: async () => cloneBoard(boardState),
		} as Response;
	});

	vi.stubGlobal("fetch", mockFetch);
});
