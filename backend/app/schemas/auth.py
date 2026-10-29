import datetime
from pydantic import BaseModel, ConfigDict

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    created_at: datetime.datetime
