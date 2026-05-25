from pydantic import BaseModel, ConfigDict


class CardModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    details: str


class ColumnModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    cardIds: list[str]


class BoardModel(BaseModel):
    model_config = ConfigDict(extra="forbid")

    columns: list[ColumnModel]
    cards: dict[str, CardModel]
