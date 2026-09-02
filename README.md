# TiffinSplit — Shared Household Tiffin Billing Application

TiffinSplit is a multi-user web application designed for roommates to track daily tiffins, calculate monthly bills, generate immutable invoices, record payments, and log household activity.

## Core Architectural Principle

**THERE IS NO ADMIN. THERE IS NO HEAD. THERE IS NO OWNER.**

Every authenticated user in a workspace has equal permissions to perform all application operations. Authorization is strictly enforced at the backend database/API layer based on workspace membership (`workspaceId` + `userId`).

---

## Tech Stack

- **Frontend:** React, Vite, React Router, CSS Modules / Design Variables, Lucide Icons
- **Backend:** Node.js, Express, REST API
- **Database / ORM:** SQLite, Prisma ORM
- **Authentication:** JWT, bcryptjs
- **Language:** 100% Pure JavaScript (`.js` / `.jsx` only)

---

## Project Structure

```
TiffinSplit/
├── client/          # React SPA Frontend (Vite)
├── server/          # Express REST API Server + Prisma SQLite
├── package.json     # Monorepo orchestration scripts
└── README.md
```

---

## Quickstart Setup & Execution

### 1. Install Dependencies

From root directory:
```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Set Up Database Schema

```bash
cd server
npx prisma db push
```

### 3. Run Development Servers (Client on port 5173, Server on port 5000)

From root directory:
```bash
npm run dev
```

---

## Environment Variables

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Server (`server/.env`)
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET=tiffinsplit_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
```
