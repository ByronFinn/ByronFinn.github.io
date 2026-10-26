# Docker 部署 PostgreSQL 与 pgvector 向量扩展

- Date: 2025-09-02
- Author: ByF
- URL: https://blog.baifan.site/postgresql-pgvector-docker-installation-guide/
- Description: 详细介绍在Docker容器中部署PostgreSQL+pgvector向量数据库的完整流程，包括环境准备、配置文件编写、初始化脚本和功能测试，为AI应用和RAG系统提供高效的向量存储解决方案。

---


在 Docker Compose 环境中运行带有 pgvector 扩展的 PostgreSQL，可以为本地或测试环境快速提供向量检索能力。

<!-- more -->

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

## 📚 参考

- [pgvector 官方文档](https://github.com/pgvector/pgvector)
- [Docker Hub: pgvector/pgvector](https://hub.docker.com/r/pgvector/pgvector)
- [PostgreSQL 官方镜像](https://hub.docker.com/_/postgres)

