# RAG Complete Guide: Build a Local RAG System from Scratch


# Building a Local RAG with LangChain + Ollama + pgvector: A Complete Hands-On Walkthrough from 0 to 1 (with uv Dependency Management and an Interview Guide)

> This post is a directly actionable document. Follow it top to bottom and you will build a local RAG (retrieval-augmented generation) system from scratch and understand the key concepts and code. All core scripts come with comments to make learning and interview review easier.
>
> **Code repository**: [https://github.com/ByronFinn/rag-lab.git](https://github.com/ByronFinn/rag-lab.git) — complete runnable example code

---

## Goals and Outcomes

- **What you will get**:

  - A locally runnable RAG system: embed your documents into a vector store, retrieve, and generate answers with an LLM.
  - A **reusable** engineering scaffold: LangChain + Ollama + pgvector + uv.
  - **Interview-ready** principles and code details: the full pipeline of retrieval, splitting, embedding, recall, reranking, and answer generation.

---

## System Architecture and Data Flow

```
┌────────────────┐    ┌────────────┐    ┌───────────────────────┐
│ Client/Frontend │ ──→ │  LangChain │ ──→ │ Ollama(Embedding/LLM) │
└────────────────┘    └────────────┘    └───────────────────────┘
       │                    │                        │
       │                    ▼                        ▼
       └──────────→ PostgreSQL + pgvector  <─────── Doc vectors
                                    ▲
                                    │
                                LangChain
```

- **Ollama**: runs the LLM and embedding model locally (the examples use `qwen3:8b` and `qwen3-embedding:4b`).
- **LangChain**: calls the Ollama API directly and orchestrates the flow of load → split → embed → store → retrieve → generate.
- **pgvector**: PostgreSQL's vector extension for storing and retrieving document vectors.
- **uv**: a blazing-fast, reproducible Python dependency and virtual environment manager.

---

## Prerequisites

- OS: macOS / Linux / WSL2 / Windows (WSL2 recommended)
- Installed: Docker (with Compose), curl
- Network access to the Ollama model repository (models are pulled automatically on first run)

> Without Docker you can also install PostgreSQL + pgvector and Ollama manually — the steps are the same. This post assumes Docker launches the backend services in one shot.

---

## One-Command Backend (Docker)

Create a project `rag-lab/` in your working directory with the following files.

### 1) `docker-compose.yml`

```yaml
version: "3.9"
services:
  pg:
    image: pgvector/pgvector:pg16
    container_name: pgvector
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ragdb
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 20

  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
    entrypoint: [
        "/bin/sh",
        "-c",
        "ollama serve & sleep 2 && \
        ollama pull qwen3:8b && \
        ollama pull qwen3-embedding:4b && \
        tail -f /dev/null",
      ]

  litellm:
    image: ghcr.io/berriai/litellm:latest
    container_name: litellm
    depends_on:
      - ollama
    ports:
      - "4000:4000"
    volumes:
      - ./litellm.yaml:/app/litellm.yaml
    environment:
      - LITELLM_CONFIG=/app/litellm.yaml
      - LITELLM_LOG=info
    command: ["--config", "/app/litellm.yaml"]

volumes:
  ollama:
```

### 2) `litellm.yaml`

```yaml
model_list:
  - model_name: local-llm
    litellm_params:
      model: ollama/qwen3:8b
      api_base: http://ollama:11434
  - model_name: local-embed
    litellm_params:
      model: ollama/qwen3-embedding:4b
      api_base: http://ollama:11434
server:
  host: 0.0.0.0
  port: 4000
```

### 3) Start the containers

```bash
docker compose up -d
```

**Verify:**

```bash
curl http://localhost:11434/api/tags          # should list the pulled models
curl http://localhost:4000/v1/models          # should include local-llm / local-embed
```

> The pgvector image ships with the extension — you generally don't need to run `CREATE EXTENSION vector;` (required only if you self-manage PG).

---

## Managing the Python Environment with uv

> uv is a Python package/environment manager written in Rust — extremely fast, zero mental overhead.

### 1) Install uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
iwr https://astral.sh/uv/install.ps1 -useb | iex

uv --version  # verify
```

### 2) Initialize the project and virtual environment

```bash
mkdir -p rag-lab/{data}
cd rag-lab
uv init   # generates .venv + pyproject.toml
```

### 3) Edit `pyproject.toml`

Fill in the dependencies under `[project]`:

```toml
[project]
name = "rag-lab"
version = "0.1.0"
description = "Local RAG with LangChain + Ollama + pgvector"
requires-python = ">=3.10"

dependencies = [
    "langchain>=0.3.0",
    "langchain-community>=0.3.0",
    "langchain-openai>=0.2.0",
    "langchain-postgres>=0.0.8",
    "langchain-ollama>=1.0.0",
    "psycopg[binary]>=3.2",
    "pydantic>=2",
    "python-dotenv>=1",
    "pypdf>=4",
    "unstructured>=0.15",
    "rapidfuzz>=3",
    "mypy>=1.18.2",
]
```

Install dependencies and generate the lock file:

```bash
uv sync
```

### 4) `.env` (for the local scripts)

```bash
PG_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ragdb
OPENAI_API_BASE=http://localhost:4000
OPENAI_API_KEY=not-needed-but-required
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Project Structure and Config Files

The recommended final layout:

```
rag-lab/
├─ docker-compose.yml
├─ litellm.yaml
├─ .env
├─ pyproject.toml
├─ data/                      # your source documents (txt/pdf/md/...)
├─ ingest.py                  # vectorization and ingestion script (commented)
├─ query.py                   # retrieval Q&A script (commented)
└─ Makefile                   # optional: one-command shortcuts
```

---

## Ingesting Data: `ingest.py` (Annotated)

```python
"""
ingest.py
— Load → split → embed → write documents under data/ into pgvector
Key things to watch:
1) How document splitting parameters affect recall
2) Choosing and swapping the embedding model (OllamaEmbeddings)
3) Vector store initialization and collection naming
"""

import os

from dotenv import load_dotenv

from langchain_community.document_loaders import (
    DirectoryLoader,
    TextLoader,
    UnstructuredMarkdownLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama.embeddings import OllamaEmbeddings
from langchain_postgres import PGVector
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

# Global config variables with type annotations
PG_URL: str = os.getenv("PG_URL", "postgresql://user:password@localhost:5432/mydb")
OLLAMA_BASE: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
COLLECTION: str = "rag_docs"  # one collection name per project, for easy reuse

# 1) Load documents: the example covers .txt and .md,
#    using the dedicated UnstructuredMarkdownLoader for markdown
loaders: list[DirectoryLoader] = [
    DirectoryLoader(
        "data",
        glob="**/*.txt",
        loader_cls=TextLoader,
        loader_kwargs={"autodetect_encoding": True},
        show_progress=True,
    ),
    DirectoryLoader(
        "data",
        glob="**/*.md",
        loader_cls=UnstructuredMarkdownLoader,
        loader_kwargs={"autodetect_encoding": True, "strategy": "fast"},
        show_progress=True,
    ),
]

docs: list[Document] = []
for loader in loaders:
    docs.extend(loader.load())

if not docs:
    raise SystemExit(
        "[ingest] 未在 data/ 下发现可加载的文档，请先放入 txt 或 md 文件！"
    )

# 2) Split
# How text splitting parameters affect retrieval (RAG):
# - chunk_size: max characters per chunk. Larger → each chunk carries more complete
#   semantics and recall is steadier; smaller → finer granularity and more precise
#   hits, but context fragments easily. Too large can dilute semantics with
#   irrelevant content; too small can split Q&A context apart and cause missed
#   recall. Rule of thumb: 500–1500.
# - chunk_overlap: characters overlapping between adjacent chunks. Moderate overlap
#   covers information crossing chunk boundaries and reduces "boundary-straddling"
#   misses; too much causes duplication, index bloat, and redundant recall.
#   Rule of thumb: 10–20% of chunk_size.
# Tuning advice: if retrieval lacks context or answers span paragraphs → increase
# both; if there's noise or the index is too large → decrease both.
splitter: RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks: list[Document] = splitter.split_documents(docs)
print(f"[ingest] 切分后得到 {len(chunks)} 个文本块。")

# 3) Embedding model
embeddings: OllamaEmbeddings = OllamaEmbeddings(
    base_url=OLLAMA_BASE, model="qwen3-embedding:4b"
)

# 4) Write into pgvector
vectorstore: PGVector = PGVector.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name=COLLECTION,
    connection=PG_URL,
    use_jsonb=True,
)

print(f"[ingest] 成功将向量写入 pgvector 集合 '{COLLECTION}'。")
```

**Best practices for Markdown processing**

- **Why UnstructuredMarkdownLoader**: compared with a plain TextLoader, UnstructuredMarkdownLoader parses markdown structure much better (headings, code blocks, lists, etc.), improving semantic understanding quality.

- **The strategy="fast" setting**: `strategy="fast"` balances speed and quality and suits most RAG scenarios. If you need finer structural parsing, try other strategies.

- **Supported file types**: the current configuration handles .txt and .md files. For PDFs, convert them to text first or use a dedicated PDF processing tool.

**Key points**

- Larger `chunk_size` packs more information into each chunk but reduces recall diversity; smaller does the opposite. Fine-tune within 600–1,200.
- The first run creates the `langchain_pg_*` tables; no manual table creation needed.

---

## Retrieval Q&A: `query.py` (Annotated)

```python
"""
query.py
— RAG-based Q&A: retrieve top-k passages, assemble the prompt, and let the local
  LLM generate the answer.
Key things to watch:
1) Retriever parameters (k / MMR) and answer quality
2) Prompt structure (system + human) and formatting of cited passages
3) Calling the local Ollama LLM directly, without a LiteLLM middle layer
"""
import os

from dotenv import load_dotenv

from langchain_postgres import PGVector
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

PG_URL = os.getenv("PG_URL")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
COLLECTION = "rag_docs"

# 1) Build the retriever: use the same embedding as the ingest stage so the
#    vector space stays consistent
emb = OllamaEmbeddings(model="qwen3-embedding:4b", base_url=OLLAMA_BASE)
vs = PGVector(collection_name=COLLECTION, connection=PG_URL, embedding_function=emb)
retriever = vs.as_retriever(search_kwargs={"k": 4})  # can be tuned to {"k": 6, "search_type": "mmr"}

# 2) Configure the LLM: through LiteLLM's OpenAI-compatible endpoint
llm = ChatOpenAI(
    model="local-llm",          # matches model_name in litellm.yaml
    base_url=OPENAI_API_BASE,
    api_key=OPENAI_API_KEY,      # any non-empty value works (LiteLLM requires one)
    temperature=0.2,
)

# 3) Prompt: inject the retrieved passages into the system message and require
#    the model to "say I don't know when it doesn't know"
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是严谨的助理。仅使用提供的检索片段回答；若无法确定，请说不知道。中文作答。\n片段：\n{context}"),
    ("human", "问题：{question}")
])

# Helper: format the passages so they can be cited in the answer
def format_docs(docs):
    return "\n\n".join([f"[来源{idx+1}] {d.page_content}" for idx, d in enumerate(docs)])

# 4) Assemble the RAG chain: question → retrieve → build prompt → call LLM →
#    parse into a string
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

if __name__ == "__main__":
    print("[query] 输入问题（回车空行退出）：")
    while True:
        q = input("问：").strip()
        if not q:
            break
        print("答：", rag_chain.invoke(q))
```

**Key points**

- The retriever's `k` and `search_type` (e.g. `mmr`) noticeably affect answer completeness and deduplication.
- For Q&A, keep `temperature` within 0.0–0.3; raise it a bit for creative writing.

---

## Run and Verify

1. **Start the backend containers** (Ollama / LiteLLM / pgvector):

```bash
docker compose up -d
```

2. **Prepare data**: drop some `.txt` or `.md` files into `data/`.

3. **Vectorize and ingest**:

```bash
uv run ingest.py
```

4. **Retrieve and query**:

```bash
uv run query.py
```

5. **Quick health check**:

```bash
# Embedding endpoint (direct to Ollama)
curl -X POST http://localhost:11434/api/embeddings \
  -d '{"model":"qwen3-embedding:4b","prompt":"测试一下向量"}'

# Chat endpoint (direct to Ollama)
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model":"qwen3:8b",
    "messages":[{"role":"user","content":"用一句话解释什么是RAG"}]
  }'
```

---

## Performance Tuning and Best Practices

- **Splitting strategy**: for long technical documents raise `chunk_size` to 1000–1200; for legal/spec-style text go larger still to preserve context.
- **Retrieval parameters**: `k=4~8`; MMR improves diversity (fewer near-duplicate chunks).
- **Index optimization**: recent pgvector supports HNSW; create an HNSW index on the `embedding` column to speed up retrieval on larger datasets.
- **Caching**: cache final answers or retrieval results at the application layer for repeated questions.
- **Logging and observability**: enable LiteLLM logging and Prometheus export; watch latency, failure rate, and retries.

---

## Common Problems and Troubleshooting Checklist

- **LiteLLM 401**: `OPENAI_API_KEY` can be any non-empty string; `OPENAI_API_BASE` must point to `http://localhost:4000`.
- **Ollama 404**: confirm the `docker compose` logs show the models being `pull`-ed; or run `docker exec -it ollama ollama pull <model>` manually.
- **psycopg connection failure**: wait for the pg health check to pass; check `PG_URL` and port mapping.
- **Garbled Chinese text**: use `autodetect_encoding=True` in `TextLoader`; keep source files UTF-8.
- **Empty PDF extraction**: try `pypdf`/`unstructured`; or convert to `txt` first.
- **Irrelevant retrieval**: increase `chunk_size`/`k`; or switch to a stronger embedding model (e.g. `mxbai-embed-large`).

---

## Bonus: Makefile and One-Command Shortcuts

Create a `Makefile` in the project root:

```Makefile
.PHONY: up down logs ingest query

up:
	docker compose up -d
	sleep 3
	curl -s http://localhost:4000/v1/models | jq . >/dev/null || true

logs:
	docker compose logs -f --tail=100

ingest:
	uv run ingest.py

query:
	uv run query.py

down:
	docker compose down
```

> From then on: `make up` → `make ingest` → `make query` → `make down`

---

## Security and Production Advice

- **Isolation**: in production, keep PG, LiteLLM, and Ollama on an internal network; expose only the application-layer API.
- **Authentication**: add gateway auth/signing in front of the LiteLLM gateway; prevent abuse.
- **Privacy**: be explicit about telemetry and logging policies; avoid writing sensitive data to disk.
- **Observability**: instrument the pipeline (retrieval latency, recall rate, answer length) with alert thresholds.

---

## Interview Guide (High-Frequency Questions and Answer Approaches)

> The Q&A below is based on this article's implementation and covers high-frequency topics from principles to engineering.

### 1) What is RAG and why do we need it?

**Key points**: RAG reduces hallucination and improves freshness by "retrieving relevant knowledge + generating answers". Compared with pure generation, RAG can pull in the latest documents and private knowledge; compared with pure retrieval, RAG can compose natural-language answers.

### 2) How does document splitting affect retrieval quality?

**Key points**: large `chunk_size` → high information density per chunk but low diversity; small → high diversity but fragmented context. 800–1200 is the engineering sweet spot in practice; fine-tune by text style.

### 3) Why pgvector?

**Key points**: coexists with relational data, mature transactions and permissions, easy deployment; recent versions support HNSW indexes with excellent query speed; rich ecosystem (backup, monitoring, managed cloud).

### 4) How to choose an embedding model?

**Key points**: consider language, domain, and budget; for Chinese/English multilingual, `qwen3-embedding:4b`/`mxbai-embed-large` are recommended; for specialized domains like legal or code, prefer domain models. Compare with retrieval Hit@k and nDCG.

### 5) Why use Ollama directly instead of LiteLLM?

**Key points**: using `langchain-ollama` directly simplifies the architecture, reduces dependencies, and gets Ollama's performance benefits; no extra proxy layer, lowering latency and complexity. For purely local deployments, direct integration is more efficient.

### 6) How to diagnose irrelevant retrieval?

**Key points**: check whether splitting is reasonable, whether the same embedding model is used, whether text preprocessing was done; increase `k` or enable `mmr`; add a rerank stage if needed (e.g. BGE/Cohere Rerank).

### 7) How to reduce hallucination?

**Key points**: the prompt must state "answer only from the passages"; provide citations/numbering; lower the temperature; if necessary add an `answerable` check or a validation chain.

### 8) How to evaluate?

**Key points**:

- Retrieval layer: Hit@k, Recall, nDCG;
- Generation layer: LLM-as-a-Judge against reference answers, factuality metrics (Faithfulness / Groundedness).
  In engineering, build offline Q/A pairs and run periodic regressions.

### 9) Key risks in production deployment?

**Key points**: permissions and data masking, cost and latency, observability and alerting, model drift and data freshness, version rollback and A/B testing.

### 10) Hand-write a minimal RAG data flow?

**Approach**: describe the steps "load → split → embed → store → retrieve → build prompt → generate" and give the key parameters (chunk, k, temperature). Refer to `ingest.py` and `query.py` in this post.

### 11) Why uv?

**Key points**: extremely fast installs, automatic virtual-environment management, lock files for reproducibility; use `uv sync --frozen` in CI/CD to guarantee dependency consistency.

### 12) How to switch between local and cloud models?

**Key points**: in real projects, just change the `model` and `base_url` parameters of `langchain_ollama` — no LiteLLM needed.

### 13) What does chunk overlap do?

**Key points**: prevents important information from being cut off at chunk boundaries and keeps context continuous. Rule of thumb: 10-20% of chunk_size.

### 14) Why MMR retrieval over plain top-k?

**Key points**: MMR (Maximal Marginal Relevance) adds diversity while preserving relevance, avoiding recall of overly similar document fragments.

### 15) How to handle splitting for long documents?

**Key points**:

- Structured documents: split along semantic boundaries like headings and paragraphs
- Unstructured documents: use dynamic chunk_size combined with overlap
- Specialized documents: incorporate domain knowledge and design a dedicated splitting strategy

### 16) What are RAG evaluation metrics?

**Key points**:

- **Retrieval metrics**: Hit@k, MRR, nDCG, Recall@K
- **Generation metrics**: BLEU, ROUGE, BERTScore
- **Task metrics**: EM (Exact Match), F1-score
- **Human evaluation**: factuality, consistency, relevance

### 17) How to design RAG prompts?

**Key points**:

- Define the role: "You are a professional Q&A assistant"
- Constrain the answer scope: "only based on the provided document content"
- Require source citations: "mark which document number you are citing"
- Handle unanswerable cases: "if the documents contain no relevant information, say so explicitly"

### 18) Where are a RAG system's performance bottlenecks?

**Key points**:

- Vector search speed: index type (HNSW vs IVF), vector dimensionality
- LLM inference latency: model size, batching, concurrency control
- Database connections: connection pooling, query optimization, caching strategy
- Network latency: where model services are deployed, data-transfer optimization

### 19) Why UnstructuredMarkdownLoader instead of a plain TextLoader?

**Key points**:

- **Structure-aware**: UnstructuredMarkdownLoader recognizes and preserves markdown's semantic structure (headings, code blocks, lists, etc.)
- **Better splitting**: splits along semantic structure rather than naive character counts
- **Better retrieval quality**: a structured content representation enables more precise vectorization and retrieval
- **Strategy configuration**: supports parameters like `strategy="fast"` to balance speed and quality

### 20) How to optimize loading strategies for different document types?

**Key points**:

- **Technical docs**: prefer UnstructuredMarkdownLoader to preserve structure
- **Code docs**: combine syntax highlighting with special handling for code blocks
- **Tabular data**: use loaders that support table parsing
- **Mixed documents**: choose the best strategy based on the dominant content and query patterns

