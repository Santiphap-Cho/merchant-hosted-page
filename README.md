# ThaiMark

A full-stack Thai snack marketplace monorepo inspired by Shopee/Lazada flash-sale UX, built with Turborepo + pnpm.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Monorepo | Turborepo, pnpm workspaces |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, React Router, Zustand |
| Backend | Node.js, Express, TypeScript, Zod |
| Storage | In-memory (no database required) |

## Project Structure

```
├── apps/
│   ├── web/              # React frontend
│   └── api/              # Express API
├── packages/
│   ├── shared-types/     # Shared TypeScript interfaces
│   ├── ui/               # Shared UI components
│   └── config/           # Shared tsconfig
└── turbo.json
```

## Prerequisites

- Node.js 18+
- pnpm 9+

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

All apps read from this **single** `.env` at the monorepo root:

| Variable | Used by | Description |
|----------|---------|-------------|
| `API_PORT` | API | Express server port |
| `WEB_PORT` | Web | Vite dev server port |
| `CORS_ORIGIN` | API | Allowed frontend origin |
| `MERCHANT_URL` | API | PayGenix callback base URL (https) |
| `PAYGENIX_SECRET_KEY` | API | PayGenix API bearer token |

### 3. Start development servers

```bash
pnpm dev
```

- **Frontend:** `https://localhost:WEB_PORT` (see `.env`)
- **API:** `http://localhost:API_PORT` (see `.env`)

Sample products are **pre-loaded in memory** on API startup — no database setup needed.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/products` | List products (pagination + category filter) |
| GET | `/api/products/:id` | Product detail |
| POST | `/api/cart` | Add item to cart |
| GET | `/api/cart/:sessionId` | Get cart contents |
| POST | `/api/orders` | Create order + PayGenix checkout session |
| GET | `/api/orders/:id` | Order detail |

## User Flow

1. Browse flash-sale products on the homepage
2. Add items to cart (synced with backend via session ID)
3. Checkout with name, address, and phone
4. Redirect to PayGenix payment page
5. Return to order confirmation at `/orders/:id`

## Sample Products

Five Thai snack products are loaded automatically:

- Tamarind Candy (฿45, 25% off)
- Mango Sticky Rice Snack Pack (฿89, 26% off)
- Crispy Seaweed Crackers (฿55, 21% off)
- Coconut Chips (฿65, 24% off)
- Thai Chili Paste / Nam Prik (฿99, 24% off)

> **Note:** Data resets when the API server restarts (in-memory storage).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all packages |
| `pnpm lint` | Type-check all packages |
