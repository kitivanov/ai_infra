import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import inspect, text

from app import models
from app.database import Base, engine
from app.routes import agents, auth, chats, resources

Base.metadata.create_all(bind=engine)
if "agents" in inspect(engine).get_table_names():
    agent_columns = {column["name"] for column in inspect(engine).get_columns("agents")}
    if "model_id" not in agent_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE agents ADD COLUMN model_id INTEGER REFERENCES models(id) ON DELETE SET NULL"))

app = FastAPI(title="AI Platform API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(agents.router)
app.include_router(resources.models_router)
app.include_router(resources.rags_router)
app.include_router(resources.mcps_router)
app.include_router(chats.router)
