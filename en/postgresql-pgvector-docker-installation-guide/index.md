# PostgreSQL + pgvector in Docker: A Complete Setup Guide


# 🐘 Installing and Deploying PostgreSQL + pgvector in Docker

This article shows how to quickly deploy a PostgreSQL database with the **pgvector** extension in a **Docker Compose** environment, so your local or development setup can support vector retrieval and AI applications (LangChain, RAG, semantic search, and the like).

---

## 📦 1. Prepare the Environment

Make sure your system has:

- Docker
- Docker Compose
- A `.env` file with database environment variables, for example:

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=appdb
```

---

## 🧱 2. Create the Project Structure

The recommended project layout:

```
dev-tools/
│
├── docker-compose.yml
├── .env
└── init.sql
```

---

## ⚙️ 3. Write the docker-compose.yml

Use the official **pgvector/pgvector** image (based on PostgreSQL 16/17, with the pgvector extension built in):

```yaml
services:
  postgre:
    image: pgvector/pgvector:pg16
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      retries: 5
      start_period: 30s
      timeout: 10s
    volumes:
      - ./postgre:/var/lib/postgresql/data/pgdata
      - ./init.sql:/docker-entrypoint-initdb.d/00_init.sql:ro
    env_file:
      - .env
    ports:
      - "5432:5432"
    environment:
      - PGDATA=/var/lib/postgresql/data/pgdata
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD?Variable not set}
      - POSTGRES_USER=${POSTGRES_USER?Variable not set}
      - POSTGRES_DB=${POSTGRES_DB?Variable not set}
```

---

## 🗃️ 4. Initialize the pgvector Extension

Create the `init.sql` file:

```sql
-- Automatically enable the pgvector extension when the database initializes
CREATE EXTENSION IF NOT EXISTS vector;
```

> This file runs automatically when the container first starts and the database initializes.

---

## 🚀 5. Start the Database

```bash
# Create the persistence directory (if it doesn't exist)
mkdir -p ./postgre

# Start the database service
docker compose up -d postgre
```

Check container status:

```bash
docker compose ps
```

When the status shows `healthy`, the database is up and running.

---

## 🔍 6. Verify pgvector Is Enabled

Run the following to confirm the extension exists:

```bash
docker compose exec -T postgre bash -lc \
'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT extname, extversion FROM pg_extension WHERE extname='\''vector'\'';"'
```

Example output:

```
 extname | extversion
---------+------------
 vector  | 0.8.0
(1 row)
```

---

## 🧠 7. A Quick Functional Test

Create a simple table in the database and run a vector similarity search:

```bash
docker compose exec -T postgre bash -lc '
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
SELECT id, embedding FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
EOF
'
```

Example output:

```
 id | embedding
----+------------
  1 | [1,2,3]
  2 | [4,5,6]
(2 rows)
```

> This confirms pgvector is enabled and can execute vector searches.

---

## ✅ 8. Summary

| Item | Value |
| -------------- | ------------------------ |
| Image | `pgvector/pgvector:pg16` |
| Default port | `5432` |
| Data persistence directory | `./postgre` |
| Initialization script | `init.sql` |
| Extension | `pgvector` |

With these steps you have successfully deployed **PostgreSQL + pgvector** in Docker.
From here you can plug it straight into LangChain, LlamaIndex, or your own RAG application.

---

## 📚 References

- [pgvector official documentation](https://github.com/pgvector/pgvector)
- [Docker Hub: pgvector/pgvector](https://hub.docker.com/r/pgvector/pgvector)
- [Official PostgreSQL image](https://hub.docker.com/_/postgres)

