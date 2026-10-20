from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8)


class UserRead(BaseModel):
    id: int
    email: EmailStr
    username: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserPublic(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ModelCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    provider: str = Field(min_length=1, max_length=100)
    model_name: str = Field(min_length=1, max_length=200)
    base_url: str | None = Field(default=None, max_length=500)
    api_key: str | None = Field(default=None, max_length=500)
    status: str = Field(default="active", max_length=30)


class ModelUpdate(ModelCreate):
    pass


class ModelRead(BaseModel):
    id: int
    name: str
    description: str | None
    provider: str
    model_name: str
    base_url: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    owner: UserPublic

    model_config = ConfigDict(from_attributes=True)


class RagCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    type: str = Field(default="document", max_length=50)
    endpoint: str | None = Field(default=None, max_length=500)
    status: str = Field(default="active", max_length=30)


class RagUpdate(RagCreate):
    pass


class RagRead(BaseModel):
    id: int
    name: str
    description: str | None
    type: str
    endpoint: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    owner: UserPublic

    model_config = ConfigDict(from_attributes=True)


class McpCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    type: str = Field(default="tool", max_length=50)
    endpoint: str | None = Field(default=None, max_length=500)
    status: str = Field(default="active", max_length=30)


class McpUpdate(McpCreate):
    pass


class McpRead(BaseModel):
    id: int
    name: str
    description: str | None
    type: str
    endpoint: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    owner: UserPublic

    model_config = ConfigDict(from_attributes=True)


class AgentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    system_prompt: str
    status: str = Field(default="active", max_length=30)
    model_id: int | None = None
    rag_ids: list[int] = Field(default_factory=list)
    mcp_ids: list[int] = Field(default_factory=list)


class AgentUpdate(AgentCreate):
    pass


class AgentRead(BaseModel):
    id: int
    name: str
    description: str | None
    system_prompt: str
    status: str
    model_id: int | None
    model: ModelRead | None
    rags: list[RagRead]
    mcps: list[McpRead]
    owner: UserPublic
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    message: str = Field(min_length=1, max_length=10000)


class MessageRead(BaseModel):
    id: int
    chat_id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatRead(BaseModel):
    id: int
    user_id: int
    agent_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatDetail(ChatRead):
    messages: list[MessageRead]


class ChatMessageResponse(BaseModel):
    user_message: MessageRead
    assistant_message: MessageRead
