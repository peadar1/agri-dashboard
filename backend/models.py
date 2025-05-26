from sqlalchemy import Column, Integer, String, create_engine
from sqlalchemy.orm import declarative_base

db_url = "sqlite:///database.db"

engine = create_engine(db_url, connect_args={"check_same_thread": False})

Base = declarative_base()

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    mobile = Column(String)
    address = Column(String)
    eircode = Column(String)

Base.metadata.create_all(engine)