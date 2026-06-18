# Restaurant Expense, Income & Inventory App

Single-restaurant management system with four roles: **SuperAdmin**, **Purchaser**, **Chief**, and **Employee**.

## Stack

- **Backend:** Node.js, Express, Sequelize, MySQL, JWT
- **Frontend:** React 19, TailAdmin template, Vite, Tailwind CSS v4

## Setup

### 1. Database

Configure MySQL credentials in `backend/.env` (see `backend/.env.example`).

```bash
cd backend
npm install
npx sequelize-cli db:create   # if database does not exist
npm run db:migrate
npm run db:seed
```

Default SuperAdmin after seeding:
- **Username:** `superadmin`
- **Password:** `admin123`

### 2. Backend

```bash
cd backend
npm run dev
```

API runs at `http://localhost:3001`

### 3. Frontend

```bash
cd free-react-tailwind-admin-dashboard-main
npm install
npm run dev
```

Frontend proxies `/api` to the backend (see `vite.config.ts`).

## Role Views

| Role | Features |
|------|----------|
| **SuperAdmin** | Dashboard, staff CRUD, ingredients, dishes, reports |
| **Purchaser** | Record purchases with invoice, price, quantity |
| **Chief** | Receive purchases, inventory, recipes, production logging |
| **Employee** | POS (quarter/half/kilo/slice), payment methods, sales history |

## API Overview

- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `CRUD /api/admins` — Staff management (SuperAdmin)
- `CRUD /api/ingredients` — Ingredients (SuperAdmin)
- `CRUD /api/dishes` — Menu items (SuperAdmin)
- `POST/GET /api/purchases` — Purchases
- `POST /api/purchases/:id/receive` — Chief receives stock
- `GET /api/stock` — Inventory levels
- `POST /api/stock/production` — Log plates made
- `POST /api/sales` — Employee POS
- `GET /api/reports/summary` — Financial summary
