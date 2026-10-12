from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TSmart Mobile Store API",
    version="1.0.0"
)

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router)

@app.get("/", tags=["Root"])
def root():
    return {"message": "TechLite API running", "docs": "/docs"}
