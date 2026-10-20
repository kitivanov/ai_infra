from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.database import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/agents", tags=["agents"])


def agent_query():
    return select(models.Agent).options(
        selectinload(models.Agent.owner),
        selectinload(models.Agent.model).selectinload(models.Model.owner),
        selectinload(models.Agent.rags).selectinload(models.Rag.owner),
        selectinload(models.Agent.mcps).selectinload(models.Mcp.owner),
    )


def get_owned_agent(db: Session, agent_id: int, owner_id: int) -> models.Agent:
    agent = db.scalar(agent_query().where(models.Agent.id == agent_id))
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    if agent.owner_id != owner_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can modify this agent")
    return agent


def apply_resources(db: Session, agent: models.Agent, payload: schemas.AgentCreate | schemas.AgentUpdate):
    agent.model = db.get(models.Model, payload.model_id) if payload.model_id is not None else None
    agent.rags = list(db.scalars(select(models.Rag).where(models.Rag.id.in_(payload.rag_ids))).all()) if payload.rag_ids else []
    agent.mcps = list(db.scalars(select(models.Mcp).where(models.Mcp.id.in_(payload.mcp_ids))).all()) if payload.mcp_ids else []
    if payload.model_id is not None and not agent.model:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Selected model does not exist")
    if len(agent.rags) != len(set(payload.rag_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="One or more selected RAG resources do not exist")
    if len(agent.mcps) != len(set(payload.mcp_ids)):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="One or more selected MCP resources do not exist")


@router.get("", response_model=list[schemas.AgentRead])
def list_agents(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    return db.scalars(agent_query().order_by(models.Agent.id)).all()


@router.get("/{agent_id}", response_model=schemas.AgentRead)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    agent = db.scalar(agent_query().where(models.Agent.id == agent_id))
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


@router.post("", response_model=schemas.AgentRead, status_code=status.HTTP_201_CREATED)
def create_agent(
    payload: schemas.AgentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    agent = models.Agent(
        name=payload.name,
        description=payload.description,
        system_prompt=payload.system_prompt,
        status=payload.status,
        owner_id=current_user.id,
    )
    apply_resources(db, agent, payload)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return db.scalar(agent_query().where(models.Agent.id == agent.id))


@router.put("/{agent_id}", response_model=schemas.AgentRead)
def update_agent(
    agent_id: int,
    payload: schemas.AgentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    agent = get_owned_agent(db, agent_id, current_user.id)
    agent.name = payload.name
    agent.description = payload.description
    agent.system_prompt = payload.system_prompt
    agent.status = payload.status
    apply_resources(db, agent, payload)
    db.commit()
    return db.scalar(agent_query().where(models.Agent.id == agent_id))


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    agent = get_owned_agent(db, agent_id, current_user.id)
    db.delete(agent)
    db.commit()
