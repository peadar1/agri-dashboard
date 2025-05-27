from sqlalchemy.orm import Session
from models import Client
from schemas import ClientCreate

# These functions use SQLAlchemy sessions to interact with the database. They are called from the FastAPI routes/endpoints in Main.py 

# Creates a new Client
def create_client(db: Session, client: ClientCreate) -> Client:
    db_client = Client(**client.model_dump())   # converts from pydantic model to plain dictionary, ** unpacks it into kword args and then makes it into a SQLAlchemy Model
    db.add(db_client)   # adds the client to the database
    db.commit()     # commits changes to DB
    db.refresh(db_client)   # reloads current object from DB to make sure all values are loaded
    return db_client

def get_client(db: Session, client_id: int):
    return db.query(Client).filter_by(Client.id == client_id).first()

def get_clients(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Client).offset(skip).limit(limit).all()

def update_client(db: Session, client_id: int, updates: dict):      # Updates is a dictionary with the new info to be added
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client:
        for key, value in updates.items():
            setattr(db_client, key, value)      # obj.field = value
        db.commit()
        db.refresh(db_client)
    return db_client

def delete_client(db: Session, client_id:int):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client:
        db.delete(db_client)
        db.commit()
    return db_client