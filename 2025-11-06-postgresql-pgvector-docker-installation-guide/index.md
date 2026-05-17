# Docker安装PostgreSQL+pgvector完整教程：AI向量数据库快速部署指南


# 🐘 在 Docker 中安装部署 PostgreSQL + pgvector

本文介绍如何在 **Docker Compose** 环境中快速部署带有 **pgvector** 扩展的 PostgreSQL 数据库，
以便在本地或开发环境中支持向量检索与 AI 应用（如 LangChain、RAG、语义搜索等）。

---

## 📦 一、准备环境

确保你的系统已安装：

- Docker
- Docker Compose
- `.env` 文件中包含数据库环境变量，例如：

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=appdb
```

---

## 🧱 二、创建项目结构

项目目录结构建议如下：

```
dev-tools/
│
├── docker-compose.yml
├── .env
└── init.sql
```

---

## ⚙️ 三、编写 docker-compose.yml

使用官方提供的 **pgvector/pgvector** 镜像（基于 PostgreSQL 16/17，内置 pgvector 扩展）：

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

## 🗃️ 四、初始化 pgvector 扩展

创建 `init.sql` 文件：

```sql
-- 初始化数据库时自动启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;
```

> 该文件会在容器首次启动、数据库初始化时自动执行。

---

## 🚀 五、启动数据库

```bash
# 创建持久化目录（如不存在）
mkdir -p ./postgre

# 启动数据库服务
docker compose up -d postgre
```

查看容器状态：

```bash
docker compose ps
```

当状态为 `healthy` 时，说明数据库已成功启动。

---

## 🔍 六、验证 pgvector 是否启用

执行以下命令确认扩展存在：

```bash
docker compose exec -T postgre bash -lc \
'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT extname, extversion FROM pg_extension WHERE extname='\''vector'\'';"'
```

输出示例：

```
 extname | extversion
---------+------------
 vector  | 0.8.0
(1 row)
```

---

## 🧠 七、简单功能测试

在数据库中创建一个简单表并执行向量相似度检索：

```bash
docker compose exec -T postgre bash -lc '
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
CREATE TABLE items (id bigserial PRIMARY KEY, embedding vector(3));
INSERT INTO items (embedding) VALUES ('[1,2,3]'), ('[4,5,6]');
SELECT id, embedding FROM items ORDER BY embedding <-> '[3,1,2]' LIMIT 5;
EOF
'
```

输出示例：

```
 id | embedding
----+------------
  1 | [1,2,3]
  2 | [4,5,6]
(2 rows)
```

> 说明 pgvector 已启用，并可执行向量检索。

---

## ✅ 八、总结

| 项目           | 值                       |
| -------------- | ------------------------ |
| 镜像           | `pgvector/pgvector:pg16` |
| 默认端口       | `5432`                   |
| 数据持久化目录 | `./postgre`              |
| 初始化脚本     | `init.sql`               |
| 扩展           | `pgvector`               |

通过以上步骤，你已经成功在 Docker 中部署了 **PostgreSQL + pgvector**。
接下来可以直接将其接入 LangChain、LlamaIndex、或自定义 RAG 应用中。

---

## 📚 参考

- [pgvector 官方文档](https://github.com/pgvector/pgvector)
- [Docker Hub: pgvector/pgvector](https://hub.docker.com/r/pgvector/pgvector)
- [PostgreSQL 官方镜像](https://hub.docker.com/_/postgres)

