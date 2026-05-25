# Frontend overview

## Purpose

The frontend is a standalone Next.js app that renders a single Kanban board UI. It is currently client-side only with in-memory state and no backend integration.

## Entry points

- src/app/layout.tsx: root layout, font setup, global styles
- src/app/page.tsx: renders the Kanban board
- src/app/globals.css: theme variables and base styling

## Core UI components

- src/components/KanbanBoard.tsx: top-level board state, drag and drop, column rename, add/delete card
- src/components/KanbanColumn.tsx: column layout, rename input, card list, drop zone
- src/components/KanbanCard.tsx: draggable card with delete action
- src/components/KanbanCardPreview.tsx: drag overlay preview
- src/components/NewCardForm.tsx: inline add-card form

## Data model and logic

- src/lib/kanban.ts: board data types, initial board data, moveCard logic, id generator
- Board state lives in KanbanBoard via React useState and is updated in-memory only

## Drag and drop

- Uses @dnd-kit/core and @dnd-kit/sortable
- DndContext in KanbanBoard handles drag start/end
- SortableContext in KanbanColumn enables vertical ordering

## Styling

- Tailwind v4 via @import "tailwindcss" in globals.css
- CSS variables in :root control colors and surfaces
- Display/body fonts configured in layout.tsx using next/font

## Testing

Unit tests (Vitest + Testing Library)
- src/components/KanbanBoard.test.tsx
- src/lib/kanban.test.ts

E2E tests (Playwright)
- tests/kanban.spec.ts

## Scripts

- npm run dev: Next.js dev server
- npm run build: build
- npm run start: production server
- npm run test:unit: Vitest
- npm run test:e2e: Playwright
- npm run test:all: unit + e2e
