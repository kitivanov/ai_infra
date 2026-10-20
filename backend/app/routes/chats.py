from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models, schemas
from app.chat_service import ChatConfigurationError, ChatProviderError, generate_reply
from app.database import get_db
from app.dependencies.auth import get_current_user

router = APIRouter(tags=["chats"])


def get_user_chat(db: Session, chat_id: int, user_id: int) -> models.Chat:
    chat = db.scalar(
        select(models.Chat)
        .options(selectinload(models.Chat.messages))
        .where(models.Chat.id == chat_id, models.Chat.user_id == user_id)
    )
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    return chat


@router.post("/agents/{agent_id}/chats", response_model=schemas.ChatDetail, status_code=status.HTTP_201_CREATED)
def create_chat(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    agent = db.get(models.Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    chat = models.Chat(user_id=current_user.id, agent_id=agent_id)
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat


@router.get("/agents/{agent_id}/chats", response_model=list[schemas.ChatRead])
def list_agent_chats(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if not db.get(models.Agent, agent_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return db.scalars(
        select(models.Chat)
        .where(models.Chat.agent_id == agent_id, models.Chat.user_id == current_user.id)
        .order_by(models.Chat.updated_at.desc())
    ).all()


@router.get("/chats/{chat_id}", response_model=schemas.ChatDetail)
def get_chat(
    chat_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return get_user_chat(db, chat_id, current_user.id)


@router.post("/chats/{chat_id}/messages", response_model=schemas.ChatMessageResponse)
def send_message(
    chat_id: int,
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    text = payload.message.strip()
    if not text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Message cannot be empty")

    chat = get_user_chat(db, chat_id, current_user.id)
    agent = db.scalar(
        select(models.Agent)
        .options(selectinload(models.Agent.model))
        .where(models.Agent.id == chat.agent_id)
    )
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    if not agent.model:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This agent has no model configured")

    history = [(message.role, message.content) for message in chat.messages]
    user_message = models.Message(chat_id=chat.id, role="user", content=text)
    db.add(user_message)
    db.flush()
    history.append(("user", text))

    try:
        answer = generate_reply(agent.model, agent.system_prompt, history)
    except ChatConfigurationError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except ChatProviderError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    assistant_message = models.Message(chat_id=chat.id, role="assistant", content=answer)
    db.add(assistant_message)
    db.commit()
    db.refresh(user_message)
    db.refresh(assistant_message)
    db.refresh(chat)
    return {"user_message": user_message, "assistant_message": assistant_message}
