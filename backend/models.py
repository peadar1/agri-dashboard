from sqlalchemy import Column, Integer, String
from database import Base

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    mobile = Column(String)
    address = Column(String)
    eircode = Column(String)
