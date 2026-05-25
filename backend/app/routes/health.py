import logging

from fastapi import APIRouter

logger = logging.getLogger("backend")

router = APIRouter()


@router.get("/api/health")
def read_health() -> dict[str, str]:
    logger.info("GET /api/health")
    return {"status": "ok"}


@router.get("/api/hello")
def read_hello() -> dict[str, str]:
    logger.info("GET /api/hello")
    return {"message": "Hello from FastAPI"}
