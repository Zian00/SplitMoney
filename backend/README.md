# SplitMoney Backend

This is the FastAPI backend for the SplitMoney application, using PostgreSQL for data storage.

## Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   ```

2. Activate the virtual environment:
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - Mac/Linux:
     ```
     source venv/bin/activate
     ```
   - Conda:
     ```
     conda activate your_env_name
     ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. PostgreSQL Setup:
   - Install PostgreSQL on your system if not already installed
   - Create a new database:
     ```
     psql -U postgres
     CREATE DATABASE splitmoney;
     \q
     ```

5. Create a `.env` file with your database credentials:
   ```
   # Database connection
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/splitmoney

   # Security
   SECRET_KEY=generated_secret_key_here
   ```

6. Set up the database tables:
   ```
   python setup_db.py
   ```

## Running the Server

Run the application:
```
python run.py
```

The server will start at http://localhost:8000.

## API Documentation

Once the server is running, you can access:
- API documentation: http://localhost:8000/docs
- Alternative documentation: http://localhost:8000/redoc

## API Endpoints

### Authentication

- **POST /auth/register** - Register a new user
  - Request: `{ "email": "user@example.com", "password": "password123" }`
  - Response: `{ "detail": "User registered successfully. Verification email sent." }`

- **POST /auth/login** - Login and get access token
  - Request: Form data with `username` (email) and `password`
  - Response: `{ "access_token": "token", "token_type": "bearer" }`

- **GET /auth/me** - Get current user information
  - Headers: `Authorization: Bearer {token}`
  - Response: User details 