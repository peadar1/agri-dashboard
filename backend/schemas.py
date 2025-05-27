# Using pydantic schemas to structure how fastAPI will create new clients, update existing ones or return client data

from pydantic import BaseModel, EmailStr
from typing import Optional

class ClientBase(BaseModel):
    first_name: str
    last_name: str  
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    eircode: Optional[str] = None

class ClientCreate(ClientBase):     # Used for post requests
    pass # Same fields as base

class Client(ClientBase):
    id: int

    class Config:
        orm_mode = True     # lets it interact with SqlAlchemy