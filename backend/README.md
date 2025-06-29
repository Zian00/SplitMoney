# SplitMoney Backend

This is the FastAPI backend for the SplitMoney application, using PostgreSQL for data storage and supporting features like authentication, group management, expense tracking, invitations, and password reset.

---

## Features

- User registration, login, and JWT authentication
- Password reset via email (secure, token-based)
- Group creation, invitations, and membership management
- Expense tracking and settlement within groups
- Email notifications (invitations, password reset)
- Scheduled cleanup of expired invitations (APScheduler)
- CORS support for frontend integration

---

## Tech Stack

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLModel](https://sqlmodel.tiangolo.com/) (SQLAlchemy + Pydantic)
- [PostgreSQL](https://www.postgresql.org/)
- [FastAPI-Mail](https://sabuhish.github.io/fastapi-mail/)
- [APScheduler](https://apscheduler.readthedocs.io/)
- [python-dotenv](https://pypi.org/project/python-dotenv/)
- [passlib](https://passlib.readthedocs.io/)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Zian00/SplitMoney.git
cd SplitMoney/backend
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
# Activate:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

Create a `.env` file in the `backend/` directory with the following content:

```env
# Database connection
DATABASE_URL_DEV=postgresql://postgres:your_password@localhost:5432/splitmoney
DATABASE_URL_PROD=postgresql://postgres:your_password@host:port/dbname

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend URL (for email links)
FRONTEND_BASE_URL=http://localhost:5173

# Email (SMTP) settings
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password
MAIL_FROM=your_email@example.com
MAIL_PORT=587
MAIL_SERVER=smtp.yourprovider.com
MAIL_STARTTLS=True
MAIL_SSL_TLS=False
```

**Note:**  
- Use strong, unique values for `SECRET_KEY` and your email password.
- Update `DATABASE_URL_PROD` and `FRONTEND_BASE_URL` for production deployments.

### 5. Set Up the Database

Make sure PostgreSQL is running and you have created the database:

```sql
-- In psql or your SQL client:
CREATE DATABASE splitmoney;
```

Then run:

```bash
python setup_db.py
```

This will create all necessary tables.

---

## Running the Server

Start the FastAPI server:

```bash
python run.py
```

The server will be available at [http://localhost:8000](http://localhost:8000).

---

## API Documentation

Once the server is running, you can access:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## API Endpoints

### Authentication

- **POST /auth/register** — Register a new user
- **POST /auth/token** — Login and get access token
- **GET /auth/users/{user_id}** — Get user info
- **PUT /auth/users/me/password** — Change password
- **POST /auth/forgot-password** — Request password reset
- **POST /auth/reset-password** — Reset password with token

### Groups & Expenses

- **GET /api/groups** — List user's groups
- **POST /api/groups** — Create a group
- **GET /api/groups/{group_id}** — Get group details
- **PUT /api/groups/{group_id}** — Edit group
- **DELETE /api/groups/{group_id}** — Delete group
- **GET /api/groups/{group_id}/members** — List group members
- **POST /api/groups/{group_id}/invite** — Invite user to group
- **GET /api/groups/{group_id}/summary** — Get group debt summary
- **POST /api/groups/{group_id}/settle** — Record a settlement

### Expenses

- **GET /api/expenses** — List all user's expenses
- **POST /api/expenses** — Create an expense
- **GET /api/expenses/{expense_id}** — Get expense details
- **PUT /api/expenses/{expense_id}** — Update expense
- **DELETE /api/expenses/{expense_id}** — Delete expense

---

## Deployment

You can deploy this backend to any cloud provider (e.g. **Vercel**, **Render**, **Heroku**, **AWS**, etc.) that supports Python and FastAPI.

### Deploy to Vercel (example)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) and create a new project.
3. Import your repository.
4. Set the build command and output:
   - **Build Command:** `pip install -r requirements.txt`
   - **Output:** (leave blank for Python)
5. Add your environment variables in the Vercel dashboard.
6. Deploy!

**Note:**  
- Make sure your production database and email credentials are set in Vercel's environment variables.
- Update `DATABASE_URL_PROD` and `FRONTEND_BASE_URL` for production.

---

## Scheduled Tasks

- The backend uses APScheduler to periodically clean up expired or accepted group invitations.

---

## License

MIT

---

**SplitMoney** – Split expenses, simplify friendships. 