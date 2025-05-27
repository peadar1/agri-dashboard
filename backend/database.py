from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

db_url = "sqlite:///database.db"

engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # autocommit makes you commit explicitly, autoflush sends changes to DB temporarily


Base = declarative_base()