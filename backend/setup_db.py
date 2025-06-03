import os
import sys
from app.database import create_db_and_tables

def main():
    """
    Setup the database tables for the SplitMoney application.
    """
    print("Setting up database tables...")
    try:
        create_db_and_tables()
        print("Database setup complete!")
        return 0
    except Exception as e:
        print(f"Error setting up database: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 