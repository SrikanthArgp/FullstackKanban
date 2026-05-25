import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { initialData, type BoardData } from "@/lib/kanban";

const cloneBoard = (data: BoardData) =>
	JSON.parse(JSON.stringify(data)) as BoardData;

beforeEach(() => {
	let boardState = cloneBoard(initialData);

	const mockFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
		const method = (init?.method ?? "GET").toUpperCase();
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
