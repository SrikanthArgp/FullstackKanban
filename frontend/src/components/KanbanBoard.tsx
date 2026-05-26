"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { AISidebar } from "@/components/AISidebar";
import { getBoard, saveBoard } from "@/lib/boardApi";
import { createId, initialData, moveCard, type BoardData, type Card } from "@/lib/kanban";

export const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardData | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  useEffect(() => {
    let isMounted = true;

    const loadBoard = async () => {
      setIsLoading(true);
      try {
        const data = await getBoard();
        if (!isMounted) {
          return;
        }
        setBoard(data);
        setError(null);
      } catch {
        if (!isMounted) {
          return;
        }
        setBoard(initialData);
        setError("Unable to load board. Showing last known layout.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBoard();
    return () => {
      isMounted = false;
    };
  }, []);

  const cardsById = useMemo(() => board?.cards ?? {}, [board]);
  const columns = board?.columns ?? [];

  const commitBoard = async (nextBoard: BoardData, skipLocalUpdate = false) => {
    if (!skipLocalUpdate) {
      setBoard(nextBoard);
    }
    setIsSaving(true);
    try {
      const saved = await saveBoard(nextBoard);
      setBoard(saved);
      setError(null);
    } catch {
      setError("Unable to save changes.");
      if (!skipLocalUpdate) {
        setBoard(nextBoard);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const applyBoardUpdate = (updater: (current: BoardData) => BoardData) => {
    setBoard((current) => {
      if (!current) {
        return current;
      }
      const nextBoard = updater(current);
      void commitBoard(nextBoard, true);
      return nextBoard;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    applyBoardUpdate((current) => ({
      ...current,
      columns: moveCard(current.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    setBoard((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        columns: current.columns.map((column) =>
          column.id === columnId ? { ...column, title } : column
        ),
      };
    });
  };

  const handleRenameCommit = (columnId: string, title: string) => {
    applyBoardUpdate((current) => ({
      ...current,
      columns: current.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    applyBoardUpdate((current) => ({
      ...current,
      cards: {
        ...current.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: current.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    applyBoardUpdate((current) => ({
      ...current,
      cards: Object.fromEntries(
        Object.entries(current.cards).filter(([id]) => id !== cardId)
      ),
      columns: current.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cardIds: column.cardIds.filter((id) => id !== cardId),
            }
          : column
      ),
    }));
  };

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const handleAiBoardUpdate = (nextBoard: BoardData) => {
    setBoard(nextBoard);
    setError(null);
  };

  if (isLoading && !board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--gray-text)]">
          Loading board
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto min-h-screen max-w-[1600px] px-6 pb-16 pt-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-10">
            <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                    Single Board Kanban
                  </p>
                  <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                    Kanban Studio
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                    Keep momentum visible. Rename columns, drag cards between stages,
                    and capture quick notes without getting buried in settings.
                  </p>
                  {error ? (
                    <p
                      className="mt-4 text-sm font-semibold text-[var(--secondary-purple)]"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}
                  {isSaving ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
                      Saving changes
                    </p>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                    Focus
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--primary-blue)]">
                    One board. Five columns. Zero clutter.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                    {column.title}
                  </div>
                ))}
              </div>
            </header>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <section className="grid gap-6 lg:grid-cols-5">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    cards={column.cardIds.flatMap((cardId) => {
                      const card = cardsById[cardId];
                      return card ? [card] : [];
                    }) as Card[]}
                    onRename={handleRenameColumn}
                    onRenameCommit={handleRenameCommit}
                    onAddCard={handleAddCard}
                    onDeleteCard={handleDeleteCard}
                  />
                ))}
              </section>
              <DragOverlay>
                {activeCard ? (
                  <div className="w-[260px]">
                    <KanbanCardPreview card={activeCard} />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          <div className="lg:sticky lg:top-10 h-fit">
            <AISidebar board={board} onBoardUpdate={handleAiBoardUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
};
