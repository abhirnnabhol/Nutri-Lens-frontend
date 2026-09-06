# NutriLens 🔍🥗

NutriLens is a packaged-food comparison web application that helps consumers compare food products using nutrition facts and ingredient information.

## Architecture

NutriLens uses a full-stack architecture with a unified analysis pipeline:

```
nutrilens/
├── frontend/             # React + React Router + CSS UI
│   └── src/
│       ├── components/   # Reusable UI elements (Buttons, Cards, Headers)
│       ├── pages/        # Route pages (LandingPage)
│       ├── layouts/      # Application shell layouts
│       ├── services/     # API service layer (Fetch client, health check)
│       ├── hooks/        # Custom React hooks
│       ├── context/      # State management context
│       ├── utils/        # Helper functions
│       └── assets/       # Static assets & icons
│
├── backend/              # Node.js + Express REST API
│   └── src/
│       ├── controllers/  # Request handlers (healthController)
│       ├── routes/       # Express route definitions
│       ├── services/     # Business logic layer
│       ├── models/       # Data access layer
│       ├── middleware/   # Error handling & CORS
│       ├── validators/   # Input validation schemas
│       ├── utils/        # Backend utilities
│       ├── config/       # Configuration (db, env)
│       ├── app.js        # Express app initialization
│       └── server.js     # HTTP server runner
│
├── database/             # PostgreSQL database assets
│   ├── migrations/       # DDL schema migrations
│   └── seed/             # Seed data scripts
│
├── .env.example
├── .gitignore
└── README.md
```

## Quick Start (Phase 1: Project Foundation)

### Prerequisites

- Node.js (v18+)
- PostgreSQL (or will run in resilient fallback mode for development)

### 1. Backend Setup

```bash
cd backend
npm install
npm run test:health # Runs the automated health endpoint test
npm start           # Starts the Express API on http://localhost:3001
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build       # Tests the production build
npm run dev         # Starts the Vite development server on http://localhost:5173
```

## Health Check API

- `GET /api/health`
  Returns the server status, timestamp, uptime, and database connectivity.
