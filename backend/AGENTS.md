# Backend overview

## Purpose

The backend is a FastAPI service that will serve API routes and static assets. In Part 2 it serves a simple HTML page at / and example API endpoints.

## Entry points

- app/main.py: FastAPI app, root HTML response, health and hello endpoints
- app/static/index.html: hello world HTML content

## Tests

- tests/test_main.py: basic health and root HTML tests

## Dependencies

- fastapi, uvicorn for the API server
- pytest, httpx for testing