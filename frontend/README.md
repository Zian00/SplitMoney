# SplitMoney Frontend

This is the React + Vite frontend for the SplitMoney application, a modern expense splitting and group management tool.

## Features

- User authentication (register, login, logout)
- Forgot password and password reset flows
- Group creation, invitations, and membership management
- Expense tracking and settlement within groups
- Responsive, modern UI built with Tailwind CSS
- API integration with the FastAPI backend

## Tech Stack

- [React 19](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)
- [FontAwesome](https://fontawesome.com/)

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development Server

Start the Vite dev server:

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Environment Variables

You can configure API endpoints using Vite environment variables.  
**Create a `.env` file in the `frontend/` directory with the following content:**

```env
# Backend API URL for development (usually your local FastAPI server)
VITE_API_URL_DEV=http://localhost:8000

# Backend API URL for production (your deployed backend, e.g. Vercel, Supabase, etc.)
VITE_API_URL_PROD=https://your-backend-url.vercel.app
```

- `VITE_API_URL_DEV`: The URL of your backend API when running locally.
- `VITE_API_URL_PROD`: The URL of your backend API when deployed to production.

**Note:**  
If you change these, restart the dev server for changes to take effect.

## Project Structure

```
frontend/
  ├── public/           # Static assets (favicon, etc.)
  ├── src/
  │   ├── api/          # Axios API client
  │   ├── components/   # React components
  │   ├── context/      # React context (Auth, etc.)
  │   ├── assets/       # Images, icons (if any)
  │   ├── index.css     # Tailwind CSS import
  │   └── main.jsx      # App entry point
  ├── index.html        # Main HTML file
  ├── package.json      # NPM scripts and dependencies
  └── tailwind.config.js
```

## Deployment

You can deploy the frontend to any static hosting provider (e.g. **Vercel**, **Netlify**, **GitHub Pages**, **Firebase Hosting**, etc.).

### Build for Production

```bash
npm run build
```

This will generate a `dist/` directory with the production-ready static files.

### Deploy to Vercel

1. **Push your code to GitHub (or another git provider).**
2. **Go to [vercel.com](https://vercel.com) and create a new project.**
3. **Import your repository.**
4. **Set the build command and output directory:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Add your environment variables in the Vercel dashboard:**
   - `VITE_API_URL_PROD` (your backend API URL)
   - (Optional) `VITE_API_URL_DEV` (for preview deployments)
6. **Deploy!**


## API

This frontend expects the backend API to be running (see `/backend/README.md` for setup).  
Update the API URLs in your `.env` as needed.

## Customization

- **Favicon:** Replace `public/favicon.png` with your own icon if desired.
- **Branding:** Update colors and logos in `index.html` and Tailwind config.

## License

MIT

---

**SplitMoney** – Split expenses, simplify friendships.



