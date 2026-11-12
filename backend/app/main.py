from pathlib import Path

from fastapi import FastAPI
from sqlalchemy import inspect, text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app import models
from app.routers import auth, products, orders, cart, messages,chatbot

Base.metadata.create_all(bind=engine)

# Safely add delivery columns to existing orders table
existing_columns = {
    column["name"]
    for column in inspect(engine).get_columns("orders")
}

delivery_columns = {
    "delivery_address": "TEXT",
    "delivery_latitude": "NUMERIC(10, 7)",
    "delivery_longitude": "NUMERIC(10, 7)",
}

with engine.begin() as connection:
    for column_name, column_type in delivery_columns.items():
        if column_name not in existing_columns:
            connection.execute(
                text(
                    f"ALTER TABLE orders ADD COLUMN "
                    f"{column_name} {column_type}"
                )
            )

app = FastAPI(
    title="Smart Mobile Store API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://techlite-frontend.onrender.com",
        "https://smart-mobile-store-xi.vercel.app",
        "https://smart-mobile-store.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Backend API routes
app.include_router(products.router)
app.include_router(auth.router)
app.include_router(orders.router)
app.include_router(cart.router)
app.include_router(messages.router)
app.include_router(chatbot.router)

# React frontend production files
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend-new" / "dist"
print("FRONTEND_DIST:", FRONTEND_DIST)
print("FRONTEND_DIST EXISTS:", FRONTEND_DIST.exists())
print("INDEX EXISTS:", (FRONTEND_DIST / "index.html").exists())

if (FRONTEND_DIST / "assets").exists():
    app.mount(
        "/assets",
        StaticFiles(directory=str(FRONTEND_DIST / "assets")),
        name="assets"
    )

# Serve React website and frontend routes
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    requested_file = FRONTEND_DIST / full_path

    if full_path and requested_file.is_file():
        return FileResponse(requested_file)

    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {"message": "Smart Mobile Store API running", "docs": "/docs"}