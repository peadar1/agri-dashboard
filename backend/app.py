from sqlalchemy.orm import sessionmaker

from models import Client, engine

Session = sessionmaker(autocommit=False, autoflush=False, bind=engine) # autocommit makes you commit explicitly, autoflush sends changes to DB temporarily

session = Session()

# client = Client(first_name="John", last_name="Doe")
# client2 = Client(first_name="Michael", last_name="Smith")
# client3 = Client(first_name="Tara", last_name="Matthews")

# session.add(client)
# session.add_all([client2, client3])
# session.commit()

# clients = session.query(Client).all() returns all clients in db
# client = session.query(Client).filter_by(id=1).one_or_none()
# client = session.query(Client).filter_by(name="Walsh").all()

session.close()
