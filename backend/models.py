from pydantic import BaseModel
from typing import Optional

class TradeCreate(BaseModel):
    date: str
    instrument: str
    direction: str
    size: float
    entry_price: float
    exit_price: float
    trade_type: str
    fees: Optional[float] = 0.0
    stop_loss: float
    take_profit: float
    rationale: Optional[str] = ""
    tags: Optional[str] = ""
    screenshot_path: Optional[str] = ""
    pre_emotion: Optional[str] = ""
    post_reflection: Optional[str] = ""

class Trade(TradeCreate):
    id: int