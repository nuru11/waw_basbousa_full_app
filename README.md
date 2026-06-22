# Restaurant Expense, Income & Inventory App

Single-restaurant management system with four roles: **SuperAdmin**, **Purchaser**, **Chief**, and **Employee**.

## Stack

- **Backend:** Node.js, Express, Sequelize, MySQL, JWT
- **Admin frontend:** React 19, TailAdmin template, Vite, Tailwind CSS v4 (`adminpanel/`)
- **Cashier frontend:** React 19, Vite, Tailwind CSS v4 (`cashier/`) — deploy on a separate subdomain

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

### 3. Admin panel

```bash
cd adminpanel
npm install
npm run dev
```

Admin panel proxies `/api` to the backend (see `adminpanel/vite.config.ts`). Default dev URL: `http://localhost:5173`

### 4. Cashier app (POS)

```bash
cd cashier
npm install
npm run dev
```

Cashier app proxies `/api` to the backend (see `cashier/vite.config.ts`). Default dev URL: `http://localhost:5174`

For production, build and deploy to your cashier subdomain:

```bash
cd cashier
# Set VITE_API_URL=https://your-api-domain.com/api in .env.production or CI
npm run build
```

Serve the `cashier/dist` folder with SPA fallback (`try_files $uri /index.html`).

## Role Views

| Role | Admin panel | Cashier app |
|------|-------------|-------------|
| **SuperAdmin** | Dashboard, staff CRUD, ingredients, dishes, reports | — |
| **Purchaser** | Record purchases with invoice, price, quantity | — |
| **Chief** | Receive purchases, inventory, recipes, production logging | Record sales (POS) |
| **Employee** | Sales history | Record sales (POS) |

Point-of-sale (recording sales) lives only in the **cashier** app. The admin panel is for management, kitchen/purchasing workflows, and viewing sales history.

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
- `POST /api/sales` — Cashier POS (employee/chief)
- `GET /api/reports/summary` — Financial summary
