import os
import sys
from app.database import engine
from sqlmodel import SQLModel

def main():
    """
    Setup the database tables for the SplitMoney application.
    This will drop all existing tables and recreate them.
    """
    print("Setting up database tables...")
    try:
        print("Dropping all existing tables...")
        # Import all your models here so the metadata knows about them
        from app.models import User, Group, Membership, Expense, ExpensePayer, ExpenseShare, GroupInvitation, PasswordResetToken
        SQLModel.metadata.drop_all(engine)
        print("Tables dropped.")
        
        print("Creating new tables...")
        SQLModel.metadata.create_all(engine)
        print("Database setup complete!")
        return 0
    except Exception as e:
        print(f"Error setting up database: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())