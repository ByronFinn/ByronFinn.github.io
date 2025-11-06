# RAG系统完全指南——从零搭建本地检索增强生成系统


# 用 LangChain + Ollama + pgvector 搭建本地 RAG：从 0 到 1 的完整实战（含 uv 依赖管理 & 面试指南）

> 本文是可直接落地的 **Markdown 文档**。按文档自上而下执行即可从零搭建出一个本地 RAG（检索增强生成）系统，并理解关键概念与代码。所有核心脚本都附带中文注释，便于学习与面试复盘。
>
> **代码仓库**：[https://github.com/ByronFinn/rag-lab.git](https://github.com/ByronFinn/rag-lab.git) - 完整可运行的示例代码

---

## 目标与成果

- **你将收获**：

  - 一个本地可运行的 RAG 系统：支持将你的文档嵌入到向量库，检索并结合大模型生成答案。
  - 一套**可复用**的工程脚手架：LangChain + Ollama + pgvector + uv。
  - **可面试**的原理与代码细节：检索、切分、嵌入、召回、重排、答案生成的完整链路。

---

## 系统架构与数据流

```
┌──────────┐      ┌────────────┐      ┌─────────────────── ───┐
│  终端/前端 │ ──→ │  LangChain │ ──→  │ Ollama(Embedding/LLM) │
└──────────┘      └────────────┘      └───────────────────────┘
       │                  │                             │
       │                  ▼                             ▼
       └──────────→ PostgreSQL + pgvector  <───────  文档向量
                                    ▲
                                    │
                                LangChain
```

- **Ollama**：本地运行 LLM 与 Embedding（示例使用 `qwen3:8b` 与 `qwen3-embedding:4b`）。
- **LangChain**：直接调用 Ollama API，组织"加载 → 切分 → 嵌入 → 入库 → 检索 → 生成"的流程。
- **pgvector**：PostgreSQL 的向量扩展，存储/检索文档向量。
- **uv**：极速、可复现的 Python 依赖与虚拟环境管理工具。

---

## 准备条件

- OS：macOS / Linux / WSL2 / Windows（建议 WSL2）
- 已安装：Docker（含 Compose）、curl
- 网络可访问 Ollama 模型仓库（首次会自动拉取模型）

> 若无 Docker 环境，也可手动安装 PostgreSQL + pgvector、Ollama，步骤同理；本文默认使用 Docker 一键启动后端服务。

---

## 一键起服务（Docker）

在你的工作目录中新建项目 `rag-lab/` 并创建下列文件。

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

### 3) 启动容器

```bash
docker compose up -d
```

**验证：**

```bash
curl http://localhost:11434/api/tags          # 应该列出已拉取的模型
curl http://localhost:4000/v1/models          # 应该包含 local-llm / local-embed
```

> pgvector 镜像已内置扩展，一般无需额外 `CREATE EXTENSION vector;`（若自建 PG，需要手动启用）。

---

## 使用 uv 管理 Python 环境

> uv 是 Rust 编写的 Python 包/环境管理器，速度极快、零心智负担。

### 1) 安装 uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
iwr https://astral.sh/uv/install.ps1 -useb | iex

uv --version  # 验证
```

### 2) 初始化项目与虚拟环境

```bash
mkdir -p rag-lab/{data}
cd rag-lab
uv init   # 生成 .venv + pyproject.toml
```

### 3) 编辑 `pyproject.toml`

在 `[project]` 下填入依赖：

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

安装依赖并生成锁文件：

```bash
uv sync
```

### 4) `.env`（本地脚本用）

```bash
PG_URL=postgresql+psycopg://postgres:postgres@localhost:5432/ragdb
OPENAI_API_BASE=http://localhost:4000
OPENAI_API_KEY=not-needed-but-required
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 项目结构与配置文件

建议最终目录如下：

```
rag-lab/
├─ docker-compose.yml
├─ litellm.yaml
├─ .env
├─ pyproject.toml
├─ data/                      # 你的原始文档（txt/pdf/md/...）
├─ ingest.py                  # 向量化与入库脚本（含注释）
├─ query.py                   # 检索问答脚本（含注释）
└─ Makefile                   # 可选：一键命令
```

---

## 数据入库：`ingest.py`（带注释）

```python
"""
ingest.py
—— 将 data/ 下的文档加载→切分→嵌入→写入 pgvector
核心看点：
1) 文档切分参数如何影响召回
2) 嵌入模型的选择与替换（OllamaEmbeddings）
3) 向量库初始化与集合命名
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

# 加载环境变量
load_dotenv()

# 全局配置变量类型标注
PG_URL: str = os.getenv("PG_URL", "postgresql://user:password@localhost:5432/mydb")
OLLAMA_BASE: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
COLLECTION: str = "rag_docs"  # 同一项目内统一集合名，便于复用

# 1) 加载文档：示例包含 .txt 与 .md，使用专用的 UnstructuredMarkdownLoader 处理 markdown
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

# 2) 切分
# 文本切分参数对检索（RAG）的影响：
# - chunk_size：每个块的最大字符数。越大→单块语义更完整、召回更稳定；越小→粒度更细、定位更准但上下文易碎。
#   过大可能引入无关内容稀释语义；过小可能把问答上下文拆开导致漏召回。经验值：500–1500。
# - chunk_overlap：相邻块的重叠字符数。适度重叠可覆盖跨块边界的信息，减少"卡边界"漏检；
#   过大则导致重复、索引膨胀与冗余召回。经验值：为 chunk_size 的 10–20%。
# 调参建议：若检索缺上下文或答案跨段→增大二者；若噪声多或索引过大→减小二者。
splitter: RecursiveCharacterTextSplitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks: list[Document] = splitter.split_documents(docs)
print(f"[ingest] 切分后得到 {len(chunks)} 个文本块。")

# 3) 嵌入模型
embeddings: OllamaEmbeddings = OllamaEmbeddings(
    base_url=OLLAMA_BASE, model="qwen3-embedding:4b"
)

# 4) 写入 pgvector
vectorstore: PGVector = PGVector.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name=COLLECTION,
    connection=PG_URL,
    use_jsonb=True,
)

print(f"[ingest] 成功将向量写入 pgvector 集合 '{COLLECTION}'。")
```

**Markdown 处理最佳实践**

- **UnstructuredMarkdownLoader 优势**：相比普通的 TextLoader，UnstructuredMarkdownLoader 能够更好地解析 markdown 的结构（如标题、代码块、列表等），提升语义理解质量。

- **strategy="fast" 配置**：`strategy="fast"` 提供了速度与质量的平衡，适合大多数 RAG 应用场景。若需要更精细的结构解析，可尝试其他策略。

- **支持的文件类型**：当前配置支持 .txt 和 .md 文件。对于 PDF 文件，建议先转换为文本格式或使用专门的 PDF 处理工具。

**要点提示**

- `chunk_size` 越大，单块信息更全但召回多样性下降；越小则相反。可在 600–1,200 之间微调。
- 首次运行会创建 `langchain_pg_*` 系列表；不用手动建表。

---

## 检索问答：`query.py`（带注释）

```python
"""
query.py
—— 基于 RAG 的问答：检索 top-k 片段，拼装提示词，让本地 LLM 生成答案。
核心看点：
1) 检索器参数（k / MMR）与答案质量
2) 提示词结构（system + human）与引用片段格式化
3) 直接调用本地 Ollama LLM，无需 LiteLLM 中间层
"""
import os

from dotenv import load_dotenv

from langchain_postgres import PGVector
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from langchain_core.vectorstores import VectorStoreRetriever
from langchain_core.documents import Document

# 加载环境变量
load_dotenv()

PG_URL = os.getenv("PG_URL")
OPENAI_API_BASE = os.getenv("OPENAI_API_BASE")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
COLLECTION = "rag_docs"

# 1) 建立检索器：与 ingest 阶段使用同款 embedding 保持向量空间一致
emb = OllamaEmbeddings(model="qwen3-embedding:4b", base_url=OLLAMA_BASE)
vs = PGVector(collection_name=COLLECTION, connection=PG_URL, embedding_function=emb)
retriever = vs.as_retriever(search_kwargs={"k": 4})  # 可调成 {"k": 6, "search_type": "mmr"}

# 2) 配置 LLM：通过 LiteLLM 的 OpenAI 兼容接口
llm = ChatOpenAI(
    model="local-llm",          # 对应 litellm.yaml 里的 model_name
    base_url=OPENAI_API_BASE,
    api_key=OPENAI_API_KEY,      # 任意非空即可（LiteLLM 需要）
    temperature=0.2,
)

# 3) 提示词：将检索到的片段注入 system，要求“不会就说不知道”
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是严谨的助理。仅使用提供的检索片段回答；若无法确定，请说不知道。中文作答。\n片段：\n{context}"),
    ("human", "问题：{question}")
])

# 帮助函数：格式化片段，便于回答时引用
def format_docs(docs):
    return "\n\n".join([f"[来源{idx+1}] {d.page_content}" for idx, d in enumerate(docs)])

# 4) 组装 RAG 链：问题 → 检索 → 拼提示 → 调 LLM → 解析字符串
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

**要点提示**

- `retriever` 的 `k` 值与 `search_type`（如 `mmr`）会显著影响答案完整性与去重效果。
- `temperature` 建议在 0.0–0.3 做问答；写作类可以适当调高。

---

## 运行与验证

1. **启动后端容器**（Ollama / LiteLLM / pgvector）：

```bash
docker compose up -d
```

2. **准备数据**：把若干 `.txt` 或 `.md` 文件放到 `data/` 目录。

3. **向量化入库**：

```bash
uv run ingest.py
```

4. **检索问答**：

```bash
uv run query.py
```

5. **快速健康检查**：

```bash
# Embedding 接口（直连 Ollama）
curl -X POST http://localhost:11434/api/embeddings \
  -d '{"model":"qwen3-embedding:4b","prompt":"测试一下向量"}'

# Chat 接口（直连 Ollama）
curl http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model":"qwen3:8b",
    "messages":[{"role":"user","content":"用一句话解释什么是RAG"}]
  }'
```

---

## 性能调优与最佳实践

- **切分策略**：长技术文档可将 `chunk_size` 提到 1000–1200，法律/规范类文本适当增大以保留上下文。
- **检索参数**：`k=4~8`；MMR 可提高多样性（减少相似块）。
- **索引优化**：pgvector 新版支持 HNSW；可在 `embedding` 列创建 HNSW 索引以提升大数据集检索速度。
- **缓存**：对重复问题可在应用层缓存最终答案或检索结果。
- **日志观测**：开启 LiteLLM 日志与 Prometheus 导出，关注延迟、失败率与重试。

---

## 常见问题与排错清单

- **LiteLLM 401**：`OPENAI_API_KEY` 需任意非空字符串；`OPENAI_API_BASE` 必须指向 `http://localhost:4000`。
- **Ollama 404**：确认 `docker compose` 日志中已 `pull` 对应模型；或手动 `docker exec -it ollama ollama pull <model>`。
- **psycopg 连接失败**：等待 pg 健康检查通过；检查 `PG_URL` 与端口映射。
- **中文乱码**：`TextLoader` 使用 `autodetect_encoding=True`；源文件统一 UTF-8。
- **PDF 提取为空**：尝试 `pypdf`/`unstructured`；或先转 `txt`。
- **检索不相关**：调大 `chunk_size`/`k`；或换更强 Embedding（如 `mxbai-embed-large`）。

---

## 加分项：Makefile 与一键命令

在根目录新建 `Makefile`：

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

> 之后你可以：`make up` → `make ingest` → `make query` → `make down`

---

## 安全与上线建议

- **隔离**：生产中将 PG、LiteLLM、Ollama 放到内网；对外仅暴露应用层 API。
- **鉴权**：LiteLLM 网关前增加网关鉴权/签名；避免滥用。
- **隐私**：明示埋点与日志策略；避免落盘敏感数据。
- **可观察性**：链路打点（检索耗时、召回率、回答长度），搭配告警门槛。

---

## 面试指南（高频问题与答题思路）

> 以下问答基于本文实现，覆盖从原理到工程化的高频考点。

### 1) 什么是 RAG？为什么需要它？

**答题要点**：RAG 通过“检索相关知识 + 生成回答”减少幻觉并提升时效性。相比纯生成，RAG 可引入最新文档、私有知识；相比纯检索，RAG 能组织语言形成自然答案。

### 2) 文档切分如何影响检索效果？

**要点**：`chunk_size` 大 → 单块信息密度高但多样性低；小 → 多样性高但上下文碎片化。一般 800–1200 是工程实践中的甜点区，按文体微调。

### 3) 为什么选择 pgvector？

**要点**：与关系型数据共存、事务与权限体系成熟，易部署；新版支持 HNSW 索引，查询速度优秀；生态丰富（备份、监控、云托管）。

### 4) Embedding 模型怎么选？

**要点**：看语种、语域与预算；中英多语推荐 `qwen3-embedding:4b`/`mxbai-embed-large`；若法律/代码等专业域，优先选领域模型。可通过检索 Hit@k、nDCG 评估对比。

### 5) 为何直接使用 Ollama 而不是 LiteLLM？

**要点**：直接使用 `langchain-ollama` 可以简化架构、减少依赖，直接享受 Ollama 的性能优势；无需额外的代理层，降低延迟和复杂性。对于纯本地部署的场景，直接集成更加高效。

### 6) 检索召回不相关如何排查？

**要点**：检查切分是否合理、是否使用相同的 embedding 模型、是否做了文本预处理；调大 `k` 或启用 `mmr`；必要时添加 rerank（如 BGE/Cohere Rerank）。

### 7) 如何降低幻觉？

**要点**：提示词明确“仅依据片段回答”；提供引用/编号；温度调低；必要时加入 `answerable` 判断或引入校验链。

### 8) 如何做评估？

**要点**：

- 检索层：Hit@k、Recall、nDCG；
- 生成层：基于参考答案的 LLM-as-a-Judge、事实性指标（Faithfulness / Groundedness）。
  工程上可离线构造 Q/A 对，周期性回归。

### 9) 生产部署的关键风险？

**要点**：权限与脱敏、成本与延迟、观测与告警、模型漂移与数据新鲜度、版本回滚与 A/B 测试。

### 10) 请手写一个最小 RAG 数据流？

**思路**：描述“加载 → 切分 → 嵌入 → 入库 → 检索 → 拼提示 → 生成”的步骤，并给出关键参数（chunk、k、temperature）。可参考本文 `ingest.py` 与 `query.py`。

### 11) 为什么要用 uv？

**要点**：极快安装、自动管理虚拟环境、生成锁文件确保可复现；CI/CD 上用 `uv sync --frozen` 保证依赖一致性。

### 12) 本地与云端模型如何切换？

**要点**：实际项目中直接修改 `langchain_ollama` 的 `model` 和 `base_url` 参数即可，无需 LiteLLM。

### 13) Chunk 重叠（overlap）的作用是什么？

**要点**：防止重要信息被截断在 chunk 边界，确保上下文连续性。经验值为 chunk_size 的 10-20%。

### 14) 为什么选择 MMR 检索而不是普通 top-k？

**要点**：MMR（Maximal Marginal Relevance）在保证相关性的同时增加多样性，避免召回过于相似的文档片段。

### 15) 如何处理长文档的切分问题？

**要点**：

- 结构化文档：按标题、段落等语义边界切分
- 非结构化文档：使用动态 chunk_size 结合 overlap
- 专业文档：考虑领域知识，设计专门的切分策略

### 16) RAG 的评估指标有哪些？

**要点**：

- **检索指标**：Hit@k、MRR、nDCG、Recall@K
- **生成指标**：BLEU、ROUGE、BERTScore
- **任务指标**：EM（Exact Match）、F1-score
- **人机评估**：事实性、一致性、相关性

### 17) 如何设计 RAG 的提示词？

**要点**：

- 明确角色定位："你是专业的问答助手"
- 约束回答范围："仅基于提供的文档内容"
- 要求引用来源："请标注引用文档编号"
- 处理无法回答的情况："如果文档中没有相关信息，请明确说明"

### 18) RAG 系统的性能瓶颈在哪里？

**要点**：

- 向量检索速度：索引类型（HNSW vs IVF）、向量维度
- LLM 推理延迟：模型大小、批处理、并发控制
- 数据库连接：连接池、查询优化、缓存策略
- 网络延迟：模型服务部署位置、数据传输优化

### 19) 为什么选择 UnstructuredMarkdownLoader 而不是普通的 TextLoader？

**要点**：

- **结构感知**：UnstructuredMarkdownLoader 能够识别和保留 markdown 的语义结构（如标题、代码块、列表等）
- **更好的分割**：基于语义结构进行切分，而不是简单的字符分割
- **提升检索质量**：结构化的内容表示有助于更精确的向量化和检索
- **策略配置**：支持 `strategy="fast"` 等参数平衡速度与质量

### 20) 如何优化不同类型文档的加载策略？

**要点**：

- **技术文档**：优先使用 UnstructuredMarkdownLoader 保持结构
- **代码文档**：结合语法高亮和代码块特殊处理
- **数据表格**：使用支持表格解析的加载器
- **混合文档**：根据主要内容和查询模式选择最优策略

