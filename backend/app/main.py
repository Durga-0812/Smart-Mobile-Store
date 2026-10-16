from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth
from app.routers import products
from app import models
from app.routers import products
from app.routers import orders

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Mobile Store API",
    version="1.0.0"
)

app.add_middleware(CORSMiddleware,
                   allow_origins=["http://localhost:5173"],
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

app.include_router(products.router)
app.include_router(auth.router)
app.include_router(orders.router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "Smart Mobile Store API running", "docs": "/docs"}
