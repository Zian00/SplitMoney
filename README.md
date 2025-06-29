# SplitMoney

[![Live Website](https://img.shields.io/badge/Live%20Website-Click%20Here-brightgreen?style=for-the-badge)](https://split-money-seven.vercel.app)

**SplitMoney** is a modern web application for splitting expenses, managing groups, and settling up with friends and family.  
It consists of a React + Vite frontend and a FastAPI + PostgreSQL backend.

---

## Project Structure 

```
SplitMoney/
  ├── backend/   # FastAPI backend (API, database, email, etc.)
  └── frontend/  # React + Vite frontend (UI, authentication, etc.)
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Zian00/SplitMoney.git
cd SplitMoney
```

### 2. Setup the Backend

See [backend/README.md](backend/README.md) for full instructions.

- Python 3.10+ and PostgreSQL required
- Configure `.env` in `backend/`
- Install dependencies:  
  `cd backend && pip install -r requirements.txt`
- Set up the database:  
  `python setup_db.py`
- Run the server:  
  `python run.py`

### 3. Setup the Frontend

See [frontend/README.md](frontend/README.md) for full instructions.

- Node.js 18+ recommended
- Configure `.env` in `frontend/`
- Install dependencies:  
  `cd frontend && npm install`
- Start the dev server:  
  `npm run dev`

---

## Deployment

- The backend can be deployed to Vercel, Render, Heroku, or any cloud supporting Python/FastAPI.
- The frontend can be deployed to Vercel, Netlify, or any static hosting provider.
- See the respective `README.md` files in each folder for deployment instructions and required environment variables.

---

## Features

- User registration, login, and JWT authentication
- Password reset via email
- Group creation, invitations, and membership management
- Expense tracking and settlement within groups
- Email notifications for invitations and password resets
- Responsive, modern UI with Tailwind CSS

---

## License

MIT

---

**SplitMoney** – Split expenses, simplify friendships.