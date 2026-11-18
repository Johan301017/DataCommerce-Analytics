"""Punto de entrada de la API REST de DataCommerce Analytics.

Ejecutar desde la carpeta backend:
    uvicorn app.main:app --reload --port 8000
Documentación interactiva: http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .database import DatabaseError
from .routers.api import router

app = FastAPI(
    title="DataCommerce Analytics API",
    description="Business Intelligence & Commercial Performance - API REST sobre MySQL 8.0",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(DatabaseError)
async def database_error_handler(_: Request, exc: DatabaseError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": "Base de datos no disponible", "error": str(exc)})


app.include_router(router)


@app.get("/", include_in_schema=False)
def raiz() -> dict[str, str]:
    return {"sistema": "DataCommerce Analytics", "documentacion": "/docs", "salud": "/api/health"}
