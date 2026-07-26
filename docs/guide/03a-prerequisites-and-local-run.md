[Damat Guide](../GUIDE.md) › Getting started

# 3.1 Prerequisites and first local run

## Requirements

- **Bun ≥ 1.1** (runtime and package manager)
- **PostgreSQL 15+**
- **Redis 7+** (optional for most happy paths)

Redis is optional for durable work. Add it when you need cache, pub/sub, locks,
sessions, rate limiting, or faster worker wake-ups.

If you do not have local services, create a `docker-compose.yml`:

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: damat
      POSTGRES_PASSWORD: damat
      POSTGRES_DB: damat
    ports: ["5432:5432"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

```bash
docker compose up -d
```

And in `.env`:

```bash
DATABASE_URL=postgres://damat:damat@localhost:5432/damat
REDIS_URL=redis://localhost:6379
```

## Create your own app

```bash
bunx @damatjs/damat-cli@latest create my-app
cd my-app
bun run dev
```

The creator asks for a PostgreSQL connection, writes `.env`, installs
dependencies, creates the database when needed, and applies migrations. Once the
process is ready, open `http://localhost:6543/health` unless you selected another
port.

## Run the reference backend

```bash
git clone https://github.com/damatjs/damat.git
cd damat
bun install
bun run build
cd backend/default
cp .env.example .env
docker compose up -d db redis
bun run db:setup
bun run dev
```

Check the result:

```bash
curl http://localhost:6543/health
```

If startup reports missing migrations, run `bun run db:status` and
`bun run db:migrate` from the generated app or `backend/default` directory.

---

Prev: [← Getting started](./03-getting-started.md) · [Guide home](../GUIDE.md) · Next: [Project structure walkthrough →](./03b-app-structure.md)
