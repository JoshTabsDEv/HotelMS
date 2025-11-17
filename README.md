## Simple Hotel Management System

A minimal hotel inventory dashboard built with the Next.js App Router,
Tailwind CSS, and MySQL. The UI sits on a single page and talks to REST-style
API routes for creating, updating, and deleting rooms—no authentication layer
required.

### Tech stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- MySQL with the `mysql2` driver

### 1. Install dependencies

```bash
cd hotelms
npm install
```

### 2. Configure MySQL

1. Create the schema/table using the provided script:

   ```bash
   mysql -u <user> -p < schema.sql
   ```

2. Copy the sample environment file and fill in your credentials:

   ```bash
   cp env.local.example .env.local
   ```

### 3. Run the app

```bash
npm run dev
```

The dashboard lives at `http://localhost:3000`. API routes are available under
`/api/rooms`.

### Production build

```bash
npm run build
npm start
```

### Key files

- `src/app/page.tsx` – client component with the CRUD UI
- `src/app/api/rooms` – REST handlers backed by MySQL
- `src/lib/db.ts` – shared connection pool helper
- `schema.sql` – bootstraps the `rooms` table
- `env.local.example` – template for required environment variables

You can extend this starter by adding guests, bookings, or housekeeping modules
following the same pattern.
