import secrets
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi import Header, HTTPException
from app.config import settings
from app.database import SessionLocal
from app.models import User
from app.security import hash_password
from pathlib import Path

from fastapi import FastAPI
from sqlalchemy import inspect, text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app import models
from app.routers import auth, products, orders, cart, messages,chatbot,analytics,payments

Base.metadata.create_all(bind=engine)

# Safely add delivery and payment columns to existing orders table
existing_columns = {
    column["name"]
    for column in inspect(engine).get_columns("orders")
}

order_columns = {
    "delivery_address": "TEXT",
    "delivery_latitude": "NUMERIC(10, 7)",
    "delivery_longitude": "NUMERIC(10, 7)",
    "payment_status": "VARCHAR(30) NOT NULL DEFAULT 'PENDING'",
    "payment_method": "VARCHAR(30)",
    "razorpay_order_id": "VARCHAR(100)",
    "razorpay_payment_id": "VARCHAR(100)",
    "notification_status": "VARCHAR(30) NOT NULL DEFAULT 'NOT_REQUIRED'",
    "notification_attempts": "INTEGER NOT NULL DEFAULT 0",
    "notification_last_error": "TEXT",
    "notification_sent_at": "TIMESTAMP",
}

with engine.begin() as connection:
    for column_name, column_type in order_columns.items():
        if column_name not in existing_columns:
            connection.execute(
                text(
                    f"ALTER TABLE orders ADD COLUMN "
                    f"{column_name} {column_type}"
                )
            )

    # Ensure Razorpay references are unique in existing databases.
    connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS "
            "ix_orders_razorpay_order_id_unique "
            "ON orders (razorpay_order_id)"
        )
    )

    connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS "
            "ix_orders_razorpay_payment_id_unique "
            "ON orders (razorpay_payment_id)"
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
app.include_router(analytics.router)
app.include_router(payments.router)

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
@app.post("/internal/admin-repair", include_in_schema=False)
def repair_admin(
    payload: dict,
    x_admin_setup_secret: str = Header(default="")
):
    if not settings.ADMIN_SETUP_SECRET or not secrets.compare_digest(
        x_admin_setup_secret,
        settings.ADMIN_SETUP_SECRET
    ):
        raise HTTPException(status_code=403, detail="Access denied")

    email = str(payload.get("email", "")).strip().lower()
    password = payload.get("password")

    if email != "techlite.admin@gmail.com":
        raise HTTPException(status_code=400, detail="Invalid admin email")

    if not isinstance(password, str) or not 12 <= len(password) <= 72:
        raise HTTPException(
            status_code=400,
            detail="Password must be 12–72 characters"
        )

    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Existing admin account not found"
            )

        user.password_hash = hash_password(password)
        user.role = "ADMIN"
        user.is_active = True

        db.commit()

        return {"message": "Existing admin account updated successfully"}

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    requested_file = FRONTEND_DIST / full_path

    if full_path and requested_file.is_file():
        return FileResponse(requested_file)

    index_file = FRONTEND_DIST / "index.html"

    if index_file.exists():
        return FileResponse(index_file)

    return {"message": "Smart Mobile Store API running", "docs": "/docs"}
