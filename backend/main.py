from sqlalchemy.orm import Session
from fastapi import FastAPI, Depends, HTTPException
from typing import List

import models, schemas, crud
from database import SessionLocal, engine
from models import Client

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

def get_db():
    db = SessionLocal()     # creates new SQLA database session from the session factory we defined in database.py
    try:
        yield db
    finally:
        db.close()

# Create a new client
@app.post("/clients/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db)):
    return crud.create_client(db=db, client=client)

@app.get("/clients/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_clients(db, skip=skip, limit=limit)



