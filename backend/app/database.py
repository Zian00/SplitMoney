from sqlmodel import SQLModel, create_engine, Session
from config import settings

engine = create_engine(settings.database_url, echo=True)

def create_db_and_tables():
    from app.models import User, Group, Membership, Expense, ExpensePayer, ExpenseShare
    SQLModel.metadata.create_all(engine)
    print("Database tables created successfully.")

def get_session():
    with Session(engine) as session:
        yield session