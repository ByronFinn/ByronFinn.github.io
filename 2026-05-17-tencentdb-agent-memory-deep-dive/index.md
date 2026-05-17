# 深度解读 TencentDB Agent Memory：让 AI Agent 真正拥有分层记忆


<!-- more -->

## 为什么 AI Agent 需要记忆系统？

如果你有过长时间使用 AI Agent 的经验，一定对以下场景不陌生：

- 每次新会话都要重新解释项目背景、代码规范、输出格式偏好
- 长任务执行到一半，上下文被海量工具日志塞满，Agent 开始"遗忘"早期指令
- 想让 Agent 学习你的工作习惯，却只能靠每次手写 system prompt

**Memory 不是为了让 AI 存下所有东西，而是为了让人不必重复所有事情。** 这是 [TencentDB Agent Memory](https://github.com/Tencent/TencentDB-Agent-Memory) 项目的核心理念。

这个由腾讯开源的项目（MIT 协议），目前已在 GitHub 获得 2400+ Star，提供了一套完整的本地化 Agent 记忆解决方案——**零外部 API 依赖**，开箱即用。

## 核心亮点一览

项目将记忆能力拆分为两大引擎：

| 能力 | 解决的问题 | 技术手段 |
|:-----|:----------|:---------|
| **符号化短期记忆** | 长任务中工具日志塞满上下文 | Mermaid 符号图谱 + 上下文卸载 |
| **分层式长期记忆** | 跨会话经验无法沉淀 | L0→L3 语义金字塔 |

{{< image src="/pictures/note/tencentdb-agent-memory-featured.svg" caption="TencentDB Agent Memory 整体架构概览" width="100%" >}}

实测数据相当有说服力：

| Benchmark | 成功率提升 | Token 节省 |
|:----------|:----------|:-----------|
| WideSearch | +51.52%（相对） | -61.38% |
| SWE-bench | +9.93% | -33.09% |
| PersonaMem | 准确率 48%→76% | — |

其中 SWE-bench 的测试方式是每个 Session 连续执行 50 个任务，模拟真实长程 Agent 的上下文累积压力——这比单题清空上下文的评测方式严格得多。

## 核心技术一：记忆分层——从 L0 到 L3 的语义金字塔

传统记忆系统将数据切片后平铺为向量，召回时如同在一堆便利贴中盲搜，缺乏宏观指引。TencentDB Agent Memory 用**分层**作为统一设计范式：

```
┌─────────────────┐
│   L3 Persona     │  ← 用户画像：日常偏好、表达风格、长期目标
├─────────────────┤
│   L2 Scenario    │  ← 场景块：按情境聚合的相关事实
├─────────────────┤
│   L1 Atom        │  ← 原子事实：结构化的最小知识单元
├─────────────────┤
│   L0 Conversation│  ← 原始对话：完整的历史记录
└─────────────────┘
```

这套分层设计不仅用于长期个性化，还贯穿于短期任务管理和未来的技能生成：

- **短期上下文分层**：底层保留原始工具输出（`refs/*.md`），中层抽取步骤摘要（`jsonl`），高层浓缩为 Mermaid 任务画布
- **长期个性化分层**：从 L0 原始对话逐步提炼到 L3 用户画像，平时靠高层把握偏好，需要细节时下钻到 Atom
- **技能生成分层**（Roadmap）：从执行轨迹中归纳解决模式，最终提炼为可复用的 Skill

**关键设计原则：每一条信息都 100% 可追溯。** 无论是短期中被卸载的报错日志，还是长期中总结的用户偏好，都可以沿着 `Persona → Scenario → Atom → Conversation` 的链路完整溯源。

底层（事实、日志、轨迹）存入数据库确保稳定检索；高层（画像、场景、画布）存为 Markdown 文件确保可读可调。**低层保留证据，高层保留结构。**

## 核心技术二：符号化记忆——用 Mermaid 表达任务状态

长任务中最消耗 Token 的往往是繁杂的过程日志——搜索结果、代码片段、报错堆栈。项目提出的**符号化记忆**方案思路清晰：

1. **完整日志卸载到外部文件**：原始工具输出保存到 `refs/*.md`
2. **提取关系并生成为 Mermaid 符号图谱**：用高密度 Mermaid 语法描绘任务状态流转
3. **轻量注入 Agent 上下文**：Agent 只看到几百 Token 的符号图谱
4. **按需溯源**：需要细节时通过 `node_id` 瞬间找回完整原文

```
繁杂日志(几十万Token) → 卸载原文 → 外部文件系统
                      → 提取关系 → Mermaid 符号图谱(带 node_id)
                                  → 轻量注入 → Agent 上下文(几百 Token)
                                               ← 按 node_id 下钻恢复原文
```

这个设计的精妙之处在于：**用最少的符号表达最多的语义**。Mermaid 既有足够的拓扑信息让 LLM 理解任务结构，又足够紧凑不会浪费 Token。

## 工程能力：不是 Demo，是可接入的插件

项目提供了两种接入方式：

### 方式一：OpenClaw 插件（一行命令安装）

```bash
openclaw plugins install @tencentdb-agent-memory/memory-tencentdb
openclaw gateway restart
```

安装后自动捕获对话、提取记忆、注入召回，零配置即可运行。

### 方式二：Hermes Gateway（Docker 一键启动）

```bash
docker build -f Dockerfile.hermes -t hermes-memory .
docker run -d \
  --name hermes-memory \
  --restart unless-stopped \
  -p 8420:8420 \
  -e MODEL_API_KEY="your-api-key" \
  -v hermes_data:/opt/data \
  hermes-memory
```

其他工程特性：

- **本地后端**：SQLite + sqlite-vec，无需额外服务
- **混合检索**：BM25 + 向量 + RRF 融合，支持关键词和语义双路召回
- **Agent 工具**：提供 `tdai_memory_search` 和 `tdai_conversation_search` 两个内置工具

## 实战：在 Pi Coding Agent 中接入的尝试与体验

作为一个日常使用 Pi Coding Agent（一款基于 CLI 的 AI 编程助手，底层通过 OpenAI 兼容 API 调用大模型）的开发者，我尝试将它与 TencentDB Agent Memory 进行对接，以下是基于实际操作的真实记录。

### 接入方式：Gateway HTTP API

TencentDB Agent Memory 目前官方支持两种宿主环境：**OpenClaw 插件**和 **Hermes Gateway**。Pi Coding Agent 不在其中。不过，项目的 Gateway 模式提供了独立的 HTTP API，这是接入第三方 Agent 的可行路径。

Gateway 启动后暴露以下端点：

| 端点 | 方法 | 用途 |
|:-----|:-----|:-----|
| `/health` | GET | 健康检查 |
| `/recall` | POST | 记忆召回（注入上下文前预取） |
| `/capture` | POST | 对话捕获（同步写入 L0） |
| `/search/memories` | POST | L1 记忆语义搜索 |
| `/search/conversations` | POST | L0 原始对话搜索 |
| `/session/end` | POST | 会话结束 + 触发 pipeline flush |
| `/seed` | POST | 批量导入历史对话 |

从架构上看，`StandaloneHostAdapter` 的 `RuntimeContext` 支持 `platform` 字段为任意字符串（定义中是 `"openclaw" | "hermes" | "cli" | "gateway" | string`），这意味着第三方框架可以以自定义 platform 身份接入。

Pi Agent 的对话以 JSONL 文件存储在 `~/.pi/agent/sessions/` 下，理论上可以通过 `/seed` 端点批量导入历史会话，再在每次对话时调用 `/capture` 写入新消息、通过 `/recall` 获取相关记忆注入上下文。

### 实际接入中遇到的情况

**好的方面：**

- **Gateway 设计解耦干净。** 核心逻辑通过 `HostAdapter` 接口与宿主框架分离，`StandaloneLLMRunner` 使用 Vercel AI SDK + OpenAI 兼容 API，Pi 的模型提供方（通过自定义 baseUrl 和 apiKey）可以直接对接，不需要改造。
- **HTTP API 接口语义清晰。** 每个端点的职责明确——capture 负责写入、recall 负责读取、search 负责查询，上手成本不高。
- **历史数据导入有现成路径。** `/seed` 端点接受批量会话数据，Pi 的 JSONL 会话记录可以通过脚本转换为 seed 格式，无需从零积累。
- **本地运行零依赖。** SQLite + sqlite-vec 全部本地化，不需要额外部署向量数据库，对个人开发者的机器环境很友好。

**不够理想的方面：**

- **没有现成的 Pi 适配器。** 目前只有 OpenClaw 和 Hermes（Standalone）两种 Adapter 实现，Pi Agent 需要自己写胶水代码来对接 Gateway HTTP API。这涉及拦截 Pi 的每轮对话、调用 capture 和 recall、将召回结果注入 prompt——目前 Pi 没有提供类似 OpenClaw 的 hook/plugin 机制来自动完成这一步。
- **Session 管理需要手动映射。** Pi 的 session 以工作目录 + 时间戳命名（如 `~/.pi/agent/sessions/--home-ssy-Projects-blog-src--/2026-05-17T...jsonl`），而 TencentDB Agent Memory 使用 `session_key` + `session_id` 管理。需要在胶水层做一对一映射，确保记忆召回时能正确定位到对应会话。
- **模型兼容性需要验证。** Gateway 的 LLM Runner 默认用于记忆提取（L1/L2/L3 pipeline），这些任务对模型的指令遵循能力有一定要求。Pi 当前使用的模型（如 GLM-5.1）在记忆提取任务上的表现需要实际测试，项目文档中只验证了 DeepSeek-V3.2 和 GPT 系列。
- **短期记忆压缩对 Coding Agent 价值有限。** 符号化短期记忆（Mermaid 画布 + 上下文卸载）主要解决的是长程任务中工具日志暴增的问题。Pi Agent 在执行代码修改时产生的工具输出通常在上下文窗口承受范围内（GLM-5.1 的上下文窗口为 200K Token），真正需要 offload 的场景相对较少。

### 一句话总结

TencentDB Agent Memory 的架构设计为第三方 Agent 接入留出了清晰的通道（Gateway HTTP API + 可扩展的 HostAdapter 接口），但目前仍需自行编写胶水代码完成对接。对于 Pi Coding Agent 这类 CLI 工具而言，长期记忆（用户偏好、项目上下文跨会话保留）的接入价值高于短期记忆压缩。期待项目后续推出跨框架的通用 Adapter 或 SDK，进一步降低接入门槛。

## 白盒可调试：记忆不是黑盒

这是该项目区别于很多记忆方案的重要特征。所有中间产物都是可读文件：

- L2 Scenario 块是 Markdown，可以直接打开检查
- L3 Persona 存放在 `persona.md`，可追溯到生成它的 Scenario
- 短期任务画布是 Mermaid，人类和 Agent 都能读懂
- 原文、摘要、节点之间通过 `result_ref` 和 `node_id` 关联

所有分层记忆产物存放在 `~/.openclaw/memory-tdai/` 下，调试时沿着链路逐层定位即可，不需要翻黑盒数据库。

## 配置参数：覆盖 90% 场景的日常调参

虽然零配置就能跑，但项目提供了三层渐进式配置体系。日常使用中最常用的几个参数：

| 参数 | 默认值 | 说明 |
|:-----|:------|:-----|
| `storeBackend` | `sqlite` | 存储后端 |
| `recall.strategy` | `hybrid` | 召回策略：keyword / embedding / hybrid（推荐） |
| `recall.maxResults` | `5` | 每次召回的条目数 |
| `pipeline.everyNConversations` | `5` | 每 N 轮触发一次 L1 记忆提取 |
| `persona.triggerEveryN` | `50` | 每积累 N 条新记忆更新一次用户画像 |

## 我的推荐理由

作为一个关注 AI Agent 基础设施发展的技术人，我认为这个项目值得关注的原因：

**1. 设计哲学正确。** 不是简单地"存更多"，而是思考"怎么存、怎么用、怎么调"。分层和符号化是对记忆系统的结构化思考，而非暴力堆砌。

**2. 完全本地化。** 零外部 API 依赖意味着数据不出本地，对隐私敏感场景非常友好。SQLite + sqlite-vec 的组合对个人开发者和中小团队足够了。

**3. 白盒设计。** 记忆系统的可解释性直接决定了可调试性和可信赖度。所有中间产物都是人可读的，这在生产环境中极其重要。

**4. 工程完成度高。** 不是概念验证，而是有完整的插件体系、Docker 支持、混合检索、配置分层。项目结构清晰，代码质量在线。

**5. 路线图有野心。** 跨 Agent 记忆迁移、Skill 自动生成、可视化调试面板——这些都是 Agent 记忆领域的核心问题。

{{< admonition type=info title="项目链接" >}}
GitHub: [https://github.com/Tencent/TencentDB-Agent-Memory](https://github.com/Tencent/TencentDB-Agent-Memory)

License: MIT | Language: TypeScript | Stars: 2400+

如果觉得有用，别忘了给项目点个 Star。
{{< /admonition >}}

## 写在最后

AI Agent 的记忆问题远未被彻底解决。当前主流方案要么依赖外部向量数据库，要么粗暴地将历史摘要塞入 prompt——前者增加部署复杂度，后者丢失关键细节。

TencentDB Agent Memory 提供了一个值得认真对待的第三条路：通过分层存储和符号化表达，在 Token 效率、信息完整性和可调试性之间找到了一个相当好的平衡点。

对于正在构建长程 Agent 应用的开发者，这个项目值得花时间研究和试用。

