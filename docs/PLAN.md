# Project plan

This plan is written as an actionable checklist for the agent. Each part lists: scope, implementation steps, tests, and success criteria. The agent must ask for approval before starting each part.

Architecture boundaries
- Frontend: Next.js app in frontend/, currently client-rendered Kanban UI, no backend dependencies.
- Backend: FastAPI app in backend/ serves API routes and static frontend build.
- Data flow: frontend calls backend API for board state; backend persists to SQLite.

Testing strategy
- Frontend: unit tests with Vitest/Testing Library; e2e with Playwright.
- Backend: unit tests with pytest; integration tests for API and persistence.

Risks and open questions
- Static build constraints for Next.js app router and assets when served by FastAPI.
- Drag-and-drop e2e tests can be flaky; may need stable selectors and retries.

## Part 1: Plan

Scope: Expand this document into an execution plan and document the existing frontend.

Checklist
- [ ] Review business requirements and technical decisions for constraints and assumptions
- [ ] Inventory current frontend structure and behavior
- [ ] Create frontend/AGENTS.md describing the existing frontend code, test setup, and entry points
- [ ] Define architecture boundaries between frontend and backend
- [ ] Define the testing strategy by layer (backend unit, frontend unit, integration, e2e)
- [ ] Identify risks and open questions

Tests
- [ ] No code execution required for this part

Success criteria
- [ ] docs/PLAN.md is updated with detailed steps, tests, and success criteria
- [ ] frontend/AGENTS.md exists and accurately documents the current frontend
- [ ] User explicitly approves the plan

## Part 2: Scaffolding

Scope: Docker infrastructure, FastAPI backend, and start/stop scripts. Serve a simple HTML page and a sample API call.

Checklist
- [ ] Add Dockerfile and docker-compose configuration for the monorepo
- [ ] Create backend FastAPI app with health and sample API route
- [ ] Serve a static hello world HTML page at /
- [ ] Implement scripts/start and scripts/stop for Mac, Windows, Linux
- [ ] Add minimal backend dependencies via uv

Tests (backend)
- [ ] Backend unit test for health endpoint
- [ ] Backend integration test: container starts, / returns HTML, /api/hello returns JSON

Success criteria
- [ ] Container runs locally and serves the HTML page at /
- [ ] API endpoint responds as expected
- [ ] Start/stop scripts work on all target platforms

## Part 3: Add in Frontend

Scope: Build and serve the existing frontend as static assets at /.

Checklist
- [ ] Configure frontend build for static output
- [ ] Update backend to serve built frontend assets at /
- [ ] Wire static asset paths and caching headers

Tests (frontend)
- [ ] Frontend unit tests for core Kanban behavior
- [ ] Frontend integration test: built frontend loads from backend at /

Success criteria
- [ ] Kanban board renders at / from backend server
- [ ] Frontend tests pass

## Part 4: Fake user sign-in experience

Scope: Require login with dummy credentials before viewing the Kanban. Provide logout.

Checklist
- [ ] Add login screen with username/password
- [ ] Validate against hardcoded credentials: user/password
- [ ] Add session state with logout
- [ ] Guard Kanban route until authenticated

Tests (frontend)
- [ ] Frontend unit test for login validation
- [ ] Frontend integration test: login gate and logout flow

Success criteria
- [ ] Unauthenticated users see login screen at /
- [ ] Authenticated users see the Kanban
- [ ] Logout returns to login screen

## Part 5: Database modeling

Scope: Define Kanban schema and document data model.

Checklist
- [ ] Propose SQLite schema for users, boards, columns, cards, and ordering
- [ ] Save schema definition as JSON in docs/
- [ ] Document data model and constraints in docs/
- [ ] Present for user approval

Tests (backend)
- [ ] No runtime tests; schema reviewed for completeness

Success criteria
- [ ] Schema JSON saved and documented
- [ ] User approves the database approach

## Part 6: Backend

Scope: API routes for CRUD on Kanban board and persistence to SQLite.

Checklist
- [ ] Create database initialization and migrations (if needed)
- [ ] Implement API endpoints for board read/update
- [ ] Ensure database created if missing
- [ ] Add input validation and error handling

Tests (backend)
- [ ] Backend unit tests for CRUD endpoints
- [ ] Database persistence tests using a temp DB

Success criteria
- [ ] API supports read/update operations for a user board
- [ ] Tests pass and DB initializes automatically

## Part 7: Frontend + Backend

Scope: Frontend uses backend API for persistence.

Checklist
- [ ] Replace local Kanban state with API calls
- [ ] Add optimistic UI or simple refresh strategy
- [ ] Handle API errors with user-friendly messages

Tests (frontend)
- [ ] Frontend integration tests for API-backed Kanban
- [ ] Frontend e2e test for basic CRUD via UI

Success criteria
- [ ] Kanban changes persist across reloads
- [ ] Tests pass for API integration

## Part 8: AI connectivity

Scope: Backend can call OpenRouter with a basic prompt.

Checklist
- [ ] Add OpenRouter client and config via env
- [ ] Implement a simple /api/ai/test endpoint

Tests (backend)
- [ ] Backend integration test for "2+2" response

Success criteria
- [ ] AI endpoint returns expected response format

## Part 9: AI with structured outputs

Scope: Send board JSON and user question; receive structured response with optional updates.

Checklist
- [ ] Define structured output schema for AI response
- [ ] Send board JSON and conversation history in prompt
- [ ] Apply optional board updates from AI

Tests (backend)
- [ ] Backend unit tests for schema validation and update application
- [ ] Backend integration test for AI call with structured response

Success criteria
- [ ] AI responses validated and safely applied
- [ ] Board updates apply when present

## Part 10: AI sidebar widget

Scope: Add UI for AI chat and board updates.

Checklist
- [ ] Implement sidebar chat UI
- [ ] Wire chat to backend AI endpoint
- [ ] Refresh Kanban on AI-driven updates

Tests (frontend)
- [ ] Frontend unit tests for chat interactions
- [ ] Frontend e2e test covering chat and board update

Success criteria
- [ ] Chat works end-to-end
- [ ] Kanban updates when AI returns changes