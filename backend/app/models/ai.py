from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from .kanban import BoardModel


class AIMessage(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant", "system"]
    content: str


class AIRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    question: str
    board: BoardModel
    history: list[AIMessage] = Field(default_factory=list)


class AIUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    board: BoardModel | None = None


class AIResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str
    updates: AIUpdate | None = None
