# 多智能体协作的工程问题：触发、拓扑和收口


把多个基于概率采样的大模型实例塞进同一个代码仓库或业务流程，本质上是在用不可靠网络和随机状态机搭建分布式系统。经典分布式系统成立的基础假设——确定性状态转移、可复现故障、拜占庭容错、原子提交——在当前的大语言模型中几乎全部失效。

<!-- more -->

业界演示里充斥着乌托邦式的脚本：一个 Agent 搜集资料，一个 Agent 编写业务逻辑，一个 Agent 补全测试，一个 Agent 审查代码，主控 Agent 如同项目经理般优雅收拢结果。然而只要将类似系统推入生产环境，面对一个 50 万行代码的单体仓库或高并发事务场景，这套设想会迅速退化成分布式灾难：并发修改产生的脑裂（Split-Brain）、无锁冲突导致的静默覆盖、非确定性状态发散、Token 预算的雪崩式坍塌，以及父子任务间的死锁与活锁。

多智能体协作从来不是 Prompt 工程的延伸，它是严苛的分布式运行时问题。谁持有写锁？子 Agent 的故障域如何隔离？上下文衰减率如何约束？当两个 Worker 分别修改了调用方与被调用方的语义时，谁来执行确定性的 CAS（Compare-And-Swap）合并？

本文抛开营销术语，从分布式系统的经典理论（Actor 模型、状态机复制、CAS、崩溃一致性）与 Codex、Claude Code、OpenClaw、Hermes、Qoder 五个真实生产架构出发，解构多智能体系统的工程底座。

---

## 1. 理论根基崩溃：非确定性状态机与一致性幻觉

要理解多智能体系统的脆弱性，必须先回到分布式一致性理论的出发点。

### 确定性状态机假设的破灭

自 Leslie Lamport 提出 Paxos 以及 Diego Ongaro 与 John Ousterhout（2014）提出 Raft 协议以来，状态机复制（State Machine Replication, SMR）的核心基石始终是一条数学公理：**确定性状态机（Deterministic State Machine, DSM）**。即对于任意节点，给定相同的初始状态 $S_0$ 和相同顺序的输入日志序列 $L = \langle e_1, e_2, \dots, e_n \rangle$，状态转移函数必须满足：

$$
\text{apply}(S_t, e_{t+1}) \to S_{t+1} \quad \text{恒成立且唯一}
$$

然而，以 Transformer 为代表的自回归语言模型本质上是一个高维概率采样器：

$$
P(w_{t+1} \mid w_1, w_2, \dots, w_t; \theta, T)
$$

哪怕在推理时将温度（Temperature）设为 0，底层 GPU 并行计算中浮点数加法的非结合律（Floating-point non-associativity: $(a + b) + c \neq a + (b + c)$）、CUDA 动态调度抖动以及混合精度量化，依然会导致生成路径的微小漂移。

这意味着：**在多智能体系统中，不存在天然的确定性副本。** 

当主控节点（Orchestrator）将任务 Fan-Out 到 3 个对等 Worker 实例时，系统并非创建了 3 个具有冗余备份意义的高可用副本，而是分裂出了 3 条随时可能产生认知发散的随机状态链。你无法用经典 Quorum（多数派选举）来验证结论的合法性——分布式系统中的多数派仲裁依赖于独立随机硬件故障假设，而大模型在面对复杂的边界条件或提示词陷阱时，表现出的是高度相关的共模失效（Common-Mode Failure）。盲目相信所谓的多数派表决，往往只是让系统以更高的置信度执行集体幻觉。

### 上下文衰减率与 Token 预算的雪崩坍塌

在传统分布式 RPC 调用中，消息载荷（Payload）与网络协议栈解耦，通信开销通常是线性的 $O(M)$。但在多智能体系统中，通信载荷即状态，状态即注意力上下文。

根据 Nelson F. Liu 等人（2023）在论文《Lost in the Middle: How Language Models Use Long Contexts》中的实证研究，随着模型上下文长度的增加，大模型对上下文中间区域的信息检索与逻辑约束遵从能力呈现明显的 U 型衰减曲线（Primacy and Recency Effects）。当主 Agent 试图将包含数万 Token 的项目结构、历史调用栈与业务契约灌入子 Agent 时，信噪比（SNR）开始急剧恶化。

更严峻的是二次方注意力与 Token 成本的雪崩。假设主 Agent 调度 $K$ 个 Worker 并发探索，每个 Worker 在工具调用循环（Tool-Execution Loop）中消费 $T_{\text{in}}$ 的输入并产生 $T_{\text{out}}$ 的探索轨迹。当这 $K$ 个分支汇聚（Fan-In）回主 Agent 做 Reduce 时，主 Agent 需要吞吐的上下文直接跃升至：

$$
T_{\text{reduce}} \approx T_{\text{base}} + \sum_{i=1}^{K} (T_{\text{in}}^{(i)} + T_{\text{out}}^{(i)})
$$

如果不做极其激进的语义有损压缩，主 Agent 的 Context Window 会在短短两轮迭代内被打满，触发强行截断或上下文压缩机制（详见 [Claude Code 上下文压缩机制深度解析]({{< ref "2026-06-17-claude-code-context-compression.md" >}}))。此时，注意力分散导致决策质量劣化，决策劣化引发更多的重试与修补工具调用，系统瞬间陷入**Token 消耗正反馈雪崩**，任务未竟而预算已空。

### 拓扑死锁与慢节点困境（The Straggler Problem）

Jeffrey Dean 与 Sanjay Ghemawat 在 2004 年发表的 MapReduce 经典论文中指出了分布式批量计算的致命短板：**落后节点（Straggler）**。一个包含 $N$ 个并行任务的 Map 阶段，整体延迟并非取决于任务的平均执行时间，而是被长尾中的最大值 $P_{99}$ 锁死。

在大模型多智能体场景中，这一问题被随机生成的耗时方差成倍放大。一个负责“安全审计”的子 Agent 可能因为遭遇一个复杂的正则表达式匹配，在沙箱里陷入长达 180 秒的 ReDoS 分析或反复调用语法分析工具，而此时负责“接口实现”和“单元测试”的子 Agent 早已完成并阻塞在栅栏同步（Barrier Synchronization）点。

更危险的是隐式依赖引发的拓扑死锁：
- Worker A 负责修改认证模块，声明其在等待外部配置规范；
- Worker B 负责配置系统，认为其输入依赖于认证模块产出的 Token 结构体定义；
- 两者在未显式定义 Directed Acyclic Graph (DAG) 拓扑序的情况下被并行拉起，系统立即陷入认知级活锁（Livelock），在彼此试探与等待中耗尽执行步数上限。

---

## 2. 触发机制的工程边界：调用栈膨胀与权限渗透

任何多智能体架构的第一道门禁是触发（Triggering）。系统在什么边界条件下允许从单线程控制流蜕变为并发控制流？这直接决定了故障域（Fault Domain）的半径。

```text
               +----------------------------------+
               |        Input Ingress Event       |
               +-----------------+----------------+
                                 |
                     [ Authentication Gate ]
                                 |
              +------------------v------------------+
              |   Entry Gateway Router (OpenClaw)   |
              +------------------+------------------+
                                 | (Resolved Identity & Policy)
              +------------------v------------------+
              |      Master Agent Loop (Claude)     |
              +--------+--------------------+-------+
                       |                    |
       [Explicit Command / Contract]    [Semantic Match]
                       |                    |
        +--------------v---+            +---v--------------+
        |  Codex Dispatch  |            | Ephemeral Worker |
        |  (Scoped Worker) |            | (Read-Only Tools)|
        +--------------+---+            +---+--------------+
                       |                    |
              +--------v--------------------v-------+
              | Durable Execution Queue / Postgres   |
              | Checkpointer (Hermes / LangGraph)   |
              +-------------------------------------+
```

### 显式触发：把并发作为危险特权

OpenAI Codex 的工程取舍最为保守。Codex 默认绝不因为用户任务听起来复杂（例如“请全面重构此模块并优化性能”）而擅自 Fork 子 Agent。它将并行执行视为一种等同于 `rm -rf` 的危险高权限操作，必须依赖用户的明确授信：

```text
Use parallel subagents.
Spawn one agent per review category.
Delegate this work in parallel and synthesize the results.
```

这种设计的核心是防御**未经授信的调用栈膨胀**。在缺少外部确定性编排约束时，一旦赋予主 Agent 自主 Fork 的权力，LLM 极易在面对模糊问题时滥用 Fan-Out 作为逃避直接决策的手段——创建 5 个子 Agent 去做泛化的网络检索，最终把无法消化的海量垃圾信息倾倒回自己的上下文。Codex 将触发决策权钉死在用户端，系统行为由此获得了最高等级的可预测性。

### 语义路由与 Description 漂移的治理

Anthropic 在 Claude Code 的普通 Subagent 机制中采用了语义触发路径（详见 [Claude Code 多智能体架构解析]({{< ref "2026-06-24-claude-code-multi-agent.md" >}}))。系统为每个注册专家分配独立的 System Prompt、工具集与 Description。主会话在每轮 `AgentLoop` 中，将当前的上下文意图与专家注册表进行语义匹配。

这一机制的工程暗礁在于 **Description 的语义重叠与路由抖动（Route Thrashing）**。

当架构师注册了以下两个专家：
- `security-auditor`: "Use proactively to review authentication, encryption, and vulnerability concerns."
- `code-reviewer`: "Use proactively to review code logic, design patterns, and potential defects."

在遇到一个涉及 JWT 过期逻辑的 PR 时，路由判决处于临界向量空间。模型可能在第 1 轮唤起 `security-auditor`，第 2 轮唤起 `code-reviewer`，产生交叉重复审查；或者更糟，在两个子 Agent 之间反复横跳（Bounce）。

**工业级 Description 必须写成刚性的前置断言（Preconditions），而非愿望清单：**

```yaml
name: auth-crypto-reviewer
description: >
  MANDATORY trigger condition: Invoke ONLY when files under src/auth/ or src/crypto/
  have modifications in the git diff. Do NOT invoke for general styling, performance,
  or UI component changes.
tools: [Read, Grep, Glob]
permissions: read-only
```

### 入口隔离：安全网关与最小权限原则（Principle of Least Privilege）

OpenClaw 展现了完全不同的触发范式：**网关前置路由**。

作为一个直面 WhatsApp、Telegram、Discord、Slack 等多入口的消息中枢，OpenClaw 清醒地意识到：不同的交互入口对应着完全异构的信任域。来自企业 Slack `#dev-ops` 频道的调用请求，与来自私人 Telegram 或公网 Webhook 的事件，绝不可进入同一个执行上下文。

Saltzer 与 Schroeder 在 1975 年阐述的计算机系统信息保护基本原则中，“最小权限原则”（Least Privilege）居于首位。OpenClaw 的触发发生在接入层：
1. 根据 `Channel ID`、`Account ID`、`Guild/Role` 判定初始安全策略；
2. 绑定专属的 `Workspace`（包含独立的 `AGENTS.md`、`SOUL.md`）与 `AgentDir`（环境凭据隔离）；
3. 实施工具集的物理屏蔽——家庭助理入口的 Agent 物理上不注入 Bash 或部署脚本执行工具。

在 OpenClaw 的世界观里，多 Agent 的第一价值是**故障域与安全边界的硬隔离**，其次才是所谓协同。

---

## 3. 拓扑演进与并发控制：从星型 Fan-Out 到网状 Mesh 的故障域

拓扑决定了信息流与状态变更的路径。不同拓扑结构的容错与并发控制成本存在数量级差异。

| 拓扑结构 | 通信复杂度 | 状态一致性保证 | 并发写入风险 | 典型生产应用 |
| :--- | :--- | :--- | :--- | :--- |
| **单 Agent** | $O(1)$ | 强确定性（单线程事务） | 零冲突 | 局部代码修复、明确步骤调试 |
| **星型 Fan-Out/In** | $O(K)$ | 弱一致（汇聚点集中收口） | 高（依赖 Reducer 裁决） | Codex Subagents, Qoder Experts |
| **流水线 Pipeline** | $O(N)$ | 顺序一致（上游输出即下游输入） | 低（串行传递所有权） | 漏洞探测 $\to$ 修复 $\to$ 验证流水线 |
| **树型分层 (Tree)** | $O(B^D)$ | 阶梯式一致（易发生层级信息衰减）| 中（严格按层隔离命名空间） | 大规模架构重构、子模块拆解 |
| **网状 Mesh** | $O(N^2)$ | 极弱（极易产生脑裂与认知环路） | 极高（需分布式写锁或 CRDT） | 多假设故障排查、红蓝对抗推演 |

### 星型 Fan-Out/Fan-In：MapReduce 的幽灵

星型是目前使用最广泛的 Subagent 形态。主 Agent 派生 $K$ 个 Worker，Worker 并行执行并向主 Agent 回传 Summary，由主 Agent 完成最后的 Merge。

这一架构的致命瓶颈在于**汇聚点的认知过载**。主 Agent 不仅要充当 Dispatcher，还要承担全量 Reducer 的职责。当 3 个 Worker 分别返回 200 行复杂的重构分析时，主 Agent 的上下文瞬间被这些非同构的见解填满。由于 Worker 之间缺乏水平通信渠道，Worker A 无法提醒 Worker B“你的底层数据结构假设已经被我的改动推翻”，所有的逻辑冲突被积压至最终回合由主 Agent 孤注一掷地裁决。

### 网状 Mesh 与 Actor 模型的教训

Claude Code Agent Teams 允许 Leader 与多个 Teammate 组成对等网络，Teammate 之间可直接互通消息并共享任务看板。这在概念上极度接近 Carl Hewitt（1973）的 Actor 模型以及 Joe Armstrong 在 Erlang/OTP 中实现的并发进程通信架构。

然而，Erlang 系统的成功建立在两个铁律之上：
1. **轻量进程的状态完全私有**，绝无共享内存；
2. **邮箱（Mailbox）具备严格的容量上限与背压机制**；
3. **Supervisor 树定义了清晰的失败级联响应策略**（`one_for_one`, `one_for_all`, `rest_for_one`）。

当前的 LLM Agent Teams 恰恰缺失了背压与确定性监控。当 4 个 Teammate 围绕一个复杂的登录故障展开自由讨论时，消息传递呈现二次方膨胀：

$$
M = \frac{N(N - 1)}{2} \times \text{Turns}
$$

不仅迅速耗尽上下文，且模型具有高度的“迎合性偏差”（Sycophancy）与注意力漂移。Teammate A 抛出一个错误的假设，Teammate B 在该假设上进行过度推演，团队迅速达成群体共识并走向逻辑盲区，完全违背了设置多角色以互相质疑的初衷。

### 物理文件系统的脑裂与并发写入控制

如果多 Agent 仅仅停留在只读分析层面，拓扑失控最多只浪费 API Token。然而，一旦赋予 Worker 写文件权限，灾难便降临到物理磁盘。

假设 Worker 1 负责重构认证模块 `src/auth/token.ts`，Worker 2 负责给整个服务添加分布式追踪 `TraceID`。在无锁环境下并发运行：
1. Worker 1 读取 `token.ts`，开始修改并写入新版代码；
2. Worker 2 同时扫描到 `token.ts`，基于旧版本插入了追踪日志；
3. Worker 2 稍晚一步保存文件，执行无条件覆写（Last-Write-Wins, LWW）。
4. **Worker 1 的核心修复被静默抹杀，且在 AST 层面不产生任何语法错误。**

```text
       [Shared Repository Working Tree] (NO Concurrency Control)
                     |
       +-------------+-------------+
       |                           |
  Worker 1 reads              Worker 2 reads
  src/auth/token.ts           src/auth/token.ts
       |                           |
  Modifies Auth Logic         Injects TraceID Logging
       |                           |
  Writes token.ts (t=1)            |
       |                      Writes token.ts (t=2) -> SILENT OVERWRITE!
       v                           v
  [Changes Lost!]             [Corrupted State Committed]
```

在分布式操作系统中，该问题通过分布式锁管理器（DLM）或 2-Phase Locking (2PL) 解决。但在 AI 编码助手中，我们无法指望概率模型正确遵循 `flock()` 协议。

**业界目前唯一可行的工程解法是物理隔离工作区：Git Worktree。**

正如 Claude Code 架构第三层所实践的那样，系统通过底层执行：

```bash
git worktree add -b feat/worker-auth .worktrees/worker-auth HEAD
git worktree add -b feat/worker-trace .worktrees/worker-trace HEAD
```

将每个具备写入权限的 Worker 隔离在独立的物理文件系统副本中。Worker 之间互不感知磁盘变更，所有的写入冲突被强行推迟到最终的 Git 分支合并阶段，交由确定性的 3-Way Merge 算法处理。**用文件系统层面的乐观并发控制（OCC），取代对模型自觉性的虚妄假设。**

---

## 4. 状态收口与原子合并：谁来写最终的 Commit Log？

很多多智能体 Demo 看起来无懈可击，是因为它们巧妙地停留在各抒己见的“分析阶段”。真正的软件工程始于状态收口：当代码必须被编译、打包、测试并通过回归时，谁来提交唯一的事务？

```text
       [Worker Worktree 1]       [Worker Worktree 2]
                |                         |
                +------------+------------+
                             |
                   [ Git 3-Way Merge ]
                             |
             +---------------+---------------+
             | (Clean Merge)                 | (Conflict / Invariant Broken)
             v                               v
    [ Deterministic Verification ]    [ Automatic Rollback / Abort ]
    - tsc / ast-grep / lint                  |
    - unit tests / integration tests         v
             |                        [ Log Failure Snapshot ]
    +--------+--------+               [ Erlang-style Restart ]
    | (Pass)          | (Fail)
    v                 v
[ Atomic Commit ]  [ Reject Patch ]
```

### 语义冲突击穿语法级 3-Way Merge

在经典版本控制体系（RFC 2822 / Git Merge Engine）中，`merge-base` 算法依赖文本行级差异：

```text
<<<<<<< HEAD
export async function authenticate(token: string, timeoutMs: number): Promise<Session> {
=======
export async function authenticate(token: string, options: AuthOptions): Promise<Session> {
>>>>>>> feat/worker-auth
```

如果两个 Worker 修改了同一个文件的不同函数，或者分别修改了两个相关联的文件，文本级合并工具会顺利判定为“自动合并成功”（Clean Merge）。

但软件系统的状态一致性是**语义不变性（Semantic Invariant）**：
- Worker A 将 `UserService.getUserById(id: string)` 重命名为 `getUser(id: UserId)`；
- Worker B 在另一个微服务目录里新增了对 `getUserById(id)` 的 5 处调用；
- Git 3-Way Merge 毫无阻碍地通过，甚至没有触发任何 Git Conflict。

此时，如果直接交卷，生产环境就会遭遇 `NoSuchMethodError` 或运行时白屏。**多智能体的收口核心，绝不能依赖 LLM 撰写一段客套的总结，而必须建立确定性的机械验证拦截网（Verification Oracle）：**

1. **AST 语义验证**：利用 `tree-sitter` 或编程语言编译器（如 `tsc --noEmit`、`cargo check`）进行全工程静态符号解析；
2. **运行时断言测试**：自动化执行受影响受控子集的回归测试套件；
3. **原子回滚（Atomic Abort）**：一旦验证未通过，立刻执行事务回滚，丢弃整个 Worktree 的 Diff，绝不保留半污染状态。

### 检查点持久化：LangGraph 的 Checkpointer 架构

在 Python 生态中，LangGraph 提供了状态机持久化的高分样板。其核心组件 `Checkpointer`（如 `PostgresSaver`）将多智能体的状态流转彻底解耦为事件溯源（Event Sourcing）模型：

```python
# LangGraph Checkpointer 核心元组定义
CheckpointTuple(
    config={"configurable": {"thread_id": "tx_20260929", "checkpoint_ns": "subagent_auth"}},
    checkpoint={
        "v": 1,
        "ts": "2026-09-29T00:40:00Z",
        "channel_values": {"files_modified": ["src/auth.ts"], "tests_passing": False},
        "channel_versions": {"files_modified": 3, "tests_passing": 3},
        "versions_seen": {"worker_1": 2}
    },
    metadata={"source": "loop", "step": 4, "writes": {"worker_1": {"status": "retry"}}},
    parent_config={"configurable": {"checkpoint_id": "019e59ca-7536-753a-bf78"}}
)
```

通过将状态版本化保存进 PostgreSQL，LangGraph 实现了两个至关重要的系统特性：
1. **时间旅行与状态回滚（Time Travel）**：当子 Agent 尝试的修复路径导致测试大面积失败时，系统无需顺着污染的历史继续纠偏，而是通过回退指针到 `checkpoint_id`，无损恢复干净状态并换用其他策略重试；
2. **人机协同（Human-in-the-loop）的异步中断**：长事务可以在任意节点将状态持久化落盘，挂起进程，释放计算资源，等待人工审计授权后再行唤醒。

### 崩溃一致性与 Crash-Only Software

George Candea 与 Armando Fox 在 2001 年的普适系统论文《Crash-Only Software》中指出：最健壮的分布式系统应当只有两种状态转换——启动和崩溃。系统不应依赖复杂的正常关机或清理逻辑，而是随时准备好应对异常掉电并迅速自愈。

多智能体系统的父子任务管理必须严格贯彻这一思想：
- **父任务中断联动**：当主任务遭遇网络断连或用户发出 `SIGINT` 时，底层运行时必须通过进程组（Process Group）或容器 cgroups 发送 `SIGKILL`，瞬间掐灭所有孤儿 Worker。Hermes 在设计中明确限定：父会话中断，活跃 Child 必须级联销毁，严防子进程在后台无序空转消耗 Token；
- **失败隔离（Fail-Stop）**：Worker 崩溃不应导致父节点崩溃。父节点将子 Agent 的崩溃记录为一个标准的错误事件（Error Event），降级为单 Agent 兜底执行或重新调度。

---

## 5. 五大生产架构的工程解构与生产折衷

理论的落脚点是生产实体的工程取舍。下表系统比对了五个前沿智能体系统的底层实现机制：

```text
  +-----------------------------------------------------------------------------------+
  |                           Five Real-World Architectures                           |
  +-----------------------------------------------------------------------------------+
  | Codex      | Explicit Fan-out  | Star (Isolated)   | Ephemeral    | Strict Sandbox|
  | Claude Code| Description / Team| Star / Mesh / Tree| Session / WT | Git Worktree  |
  | OpenClaw   | Gateway Ingress   | Multi-tenant Gate | Persistent   | Per-Agent Dir |
  | Hermes     | RPC / Kanban Board| RPC / Durable DAG | SQLite / WAL | Capped Workers|
  | Qoder      | Upfront Plan Gate | Star (Specialized)| Transactional| Tiered Sandbox|
  +-----------------------------------------------------------------------------------+
```

### Codex：确定性优先的沙箱隔离

Codex 展现出极高的一线基础设施工程师审美。它几乎完全放弃了花哨的多智能体自发协作噱头，将重心放在执行沙箱的稳固性上：
- **无自主衍生特权**：子 Agent 不具备继续创建下级 Agent 的权限，深度（Depth）死锁在 1；
- **角色清晰分工**：`explorer` 默认只读，禁止写入，其输出是结构化的证据链路（文件名、行号、代码摘录）；`worker` 具备受限写权限，但必须在 Prompt 契约中明确绑定单目录或单文件 Ownership；
- **汇聚归因**：所有修改在呈现给人类前，由主 Agent 生成统一的 Git Patch，将 AI 的每一次并发行为锚定在 Git 事务内。

### Claude Code：三层渐进结构与物理工作区

Claude Code 的演进脉络清晰地勾勒出从简单到复杂工程场景的应对之策：
1. **第一层（普通 Subagent）**：解决单会话内的上下文污染问题。长文本日志、大型代码扫描放进临时子上下文，阅后即焚，仅回传精要结论；
2. **第二层（Agent Teams）**：针对多假设定位场景。Leader 维护共享任务列表（Shared Task List），各 Teammate 独立推进，适用于互不锁定的并行调研；
3. **第三层（Worktree & Batch 重构）**：面对全仓库级（Repo-wide）迁移或机械化重构时，彻底放弃模型间协商，通过物理拆分 `git worktree`，按目录范围硬切并发面，最终统一由测试套件验证。

### OpenClaw：消息网关与多租户隔离

OpenClaw 从根本上不是一个代码生成工具，而是一个企业级 Agent 操作系统：
- **入口多路复用**：以协议适配器承接多元消息总线，通过路由规则将流量引导至不同的 Agent 运行容器；
- **凭据与状态沙箱**：每个 Agent 拥有独立的存储根目录与会话数据库，避免不同权限级别的 Agent 互相嗅探敏感上下文；
- **ACP 适配层**：将外部成熟的 Coding Harness（如 Codex、Claude Code CLI）作为下游工具进行编排，保持自身作为轻量级智能网关的架构纯粹性。

### Hermes：RPC 与持久化状态机的清晰分界

Hermes 解决了一个长期困扰开发者的混淆：短程任务与长程任务的区别。
- **短程 RPC（`delegate_task`）**：父会话阻塞等待，子任务在隔离终端中跑完并回传 Summary，生命周期局限在数十秒至几分钟内；
- **长程持久队列（Kanban）**：任务持久化写入 SQLite 数据库（WAL 模式保证并发），具备状态机转移标签（`TODO -> IN_PROGRESS -> BLOCKED -> COMPLETED`）。任务可以跨越数天、经历系统重启、等待人工审核回复，由 Dispatcher 根据可用 Worker Profile 动态接力认领。

### Qoder：前置规划契约与分级沙箱

Qoder 在用户体验与系统可控性之间找到了精巧的平衡点：
- **前置合同审查（Upfront Planning）**：在 Experts 模式下，Team Lead 在派发任务前必须先生成结构化实施计划并阻断等待人类确认。这相当于由 AI 拟定并发协作契约，人类完成审计盖章，彻底解决了不可见并发带来的惊悚感；
- **分级沙箱终端（Tiered Sandbox）**：低危只读命令直接放行；高危破坏性命令进入容器沙箱；逃逸或提权操作触发强制人工审批，在执行力与系统安全性之间划出红线。

---

## 6. 架构决策准则：给分布式工程师的选型清单

在把一个多智能体系统推向生产之前，系统架构师应当像审查分布式事务一样，逐项核对以下工程约束：

```text
                     [ New Task Arrives ]
                              |
                +-------------v-------------+
                | Can a single agent loop   |
                | handle it deterministically?
                +-------------+-------------+
                              |
                     [Yes]    |    [No]
             +----------------+----------------+
             |                                 |
     (Run Single Agent)          +-------------v-------------+
     Keep context lean;          | Is context pollution or   |
     Short feedback loop.        | long-tail search the issue?
                                 +-------------+-------------+
                                               |
                                      [Yes]    |    [No]
                              +----------------+----------------+
                              |                                 |
                      (Star Fan-Out)              +-------------v-------------+
                      Spawn Read-Only             | Do tasks have strict sequential
                      Explorer Workers            | data dependencies?
                                                  +-------------+-------------+
                                                                |
                                                       [Yes]    |    [No]
                                               +----------------+----------------+
                                               |                                 |
                                       (Serial Pipeline)          +-------------v-------------+
                                       Pass context downstream;   | Will workers write to disk
                                       Topological order execution| simultaneously?
                                                                  +-------------+-------------+
                                                                                |
                                                                       [Yes]    |    [No]
                                                               +----------------+----------------+
                                                               |                                 |
                                                       (Git Worktree OCC)         (Actor Mesh Team)
                                                       Physical isolation;        Read-only hypothesis
                                                       Compiler verification.     testing; bounded turns.
```

### 生产选型五戒

1. **单线程优先法则**：凡是上下文未达上限、步骤强依赖、逻辑边界模糊的问题，坚决使用单 Agent 顺序迭代。多智能体带来的协同熵增往往数倍于其所谓的并行收益；
2. **读写分离与写入隔离法则**：Fan-Out 的子 Agent 默认必须为纯只读节点。一旦涉及代码或数据写入，必须建立物理隔离区（Worktree 或独立临时容器），严禁在同一物理工作目录内执行无锁并发写；
3. **确定性验收门禁（Verification Oracle）**：任何多智能体汇聚收口节点，必须接入编译检查、静态代码分析与单元测试套件。不能通过机械验证的代码合并，必须立刻触发自动回滚；
4. **长短生命周期解耦法则**：生命周期超过单次会话轮次（Turn）的长任务，必须采用状态机持久化存储（如 SQLite/PostgreSQL），严禁试图通过维持常驻 Agent 会话来逃避状态落盘；
5. **熔断与级联销毁法则**：必须强制配置最大并发宽度（Concurrency Width $\le 4$）与最大递归深度（Max Spawn Depth $\le 2$）。父任务接收到取消信号时，必须向所有子节点广播物理中断。

### 工业级委派契约规范（Delegation Contract Specification）

在实际工程落地中，主 Agent 向子 Agent 发起任务委派时，绝不可传递模糊的口头指令，而应生成严格的符合 RFC 规范的机器可读契约：

```yaml
Contract:
  Version: "1.0-RFC"
  TaskID: "task_auth_audit_0929"
  Timestamp: "2026-09-29T00:40:00Z"
  Identity:
    Role: "Read-Only Security Explorer"
    Profile: "security-auditor-v2"
  Scope:
    TargetPaths:
      - "src/auth/**"
      - "src/middleware/session.ts"
    ForbiddenPaths:
      - "src/database/**"
      - "config/secrets/**"
  Capabilities:
    FileRead: true
    FileWrite: false
    NetworkAccess: false
    TerminalCommandLevel: "read-only-inspect"
    SubagentSpawnAllowed: false
  Invariants:
    - "Do NOT alter any existing business interfaces."
    - "Do NOT attempt to format or refactor unrelated files."
  VerificationOracle:
    Format: "JSON"
    Schema:
      type: "object"
      required: ["findings", "risk_level", "suggested_patch_boundaries"]
  TimeoutSeconds: 120
  OnFailure: "Fail-Stop and emit snapshot"
```

---

多智能体系统的本质，是分布式软硬件协同约束在大模型时代的一次极端投影。抛弃对“自主群体智能”的狂热盲信，回到分布式系统的第一性原理——厘清故障域、收紧写锁、约束上下文熵增、以确定性编译与测试守住底线——工程系统才能在概率波动的浪潮中真正站稳脚跟。

