# Data model

This document describes the SQLite data model for the Kanban app.

## Entities and relationships

- Users own boards. A user has exactly one board in the MVP.
- Boards contain columns.
- Columns contain cards.

Relationships
- users 1 --- 1 boards (enforced with unique constraint on boards.user_id)
- boards 1 --- n columns
- columns 1 --- n cards

## Ordering rules

- Column order is defined by columns.position within a board.
- Card order is defined by cards.position within a column.
- Positions are integers and are unique within their scope.

## Constraints and behavior

- Deleting a user deletes their board, columns, and cards (cascade).
- Deleting a board deletes its columns and cards (cascade).
- Deleting a column deletes its cards (cascade).
- usernames are unique.
- Single-board-per-user enforced by unique boards.user_id.

## Timestamps

- created_at and updated_at are stored as ISO-8601 strings in UTC.
- updated_at is required for cards to support edits.

## Schema reference

See docs/schema.json for the authoritative table definitions.
