import logging
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("backend")

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"


@app.get("/api/health")
def read_health() -> dict[str, str]:
    logger.info("GET /api/health")
    return {"status": "ok"}


@app.get("/api/hello")
def read_hello() -> dict[str, str]:
    logger.info("GET /api/hello")
    return {"message": "Hello from FastAPI"}


@app.on_event("startup")
def log_startup() -> None:
    logger.info("Backend started")
    logger.info("Serving static assets from %s", STATIC_DIR)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        logger.exception(
            "Request failed",
            extra={
                "method": request.method,
                "path": request.url.path,
                "duration_ms": round(duration_ms, 2),
            },
        )
        raise

    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "%s %s -> %s (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
