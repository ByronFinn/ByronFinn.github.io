# 多智能体协作的工程问题：触发、拓扑和收口


先说结论：多智能体协作不是"多开几个模型实例"。它要解决的是任务调度、上下文隔离、权限控制、状态管理和结果合并——每一个都是工程问题，不是 prompt 问题。

<!-- more -->

抖音小红书上的多智能体故事通常是这样：一个 agent 查资料，一个 agent 写代码，一个 agent 跑测试，一个 agent 做 review，主 agent 像项目经理一样收结果。评论区："我去好牛逼。"

真正用过的人只会摇头。

换成工程语言：谁有权创建 worker？worker 拿到多少上下文？能不能写文件？多个 worker 写同一区域怎么办？worker 失败、超时、被中断时，父任务怎么恢复？结果回来以后，谁判断冲突，谁做 merge？这些都是运行时设计问题，跟模型能力关系不大。

下面从 Codex、Claude Code、OpenClaw、Hermes 四个系统的实际设计出发，把多智能体的工程问题拆开看。

## 触发和拓扑是两个问题

很多讨论混在一起，是因为把两个问题当成一个。

**触发**：系统什么时候从单 agent 变成多 agent？

**拓扑**：变成多 agent 之后，它们怎么组织？是主 agent 派 worker 后统一收口，还是 worker 之间能互相通信？是当前 turn 里等结果回来，还是放进持久队列，明天再继续？

### 四种触发方式

{{< image src="/pictures/posts/multi-agent-collaboration-topology.svg" caption="多智能体主要拓扑形态" width="100%">}}

**显式触发**。用户直接说 "use parallel subagents" 或 "spawn one agent per review category"。Codex 主要走这条路。它不会因为任务看起来复杂就擅自开 worker，把并行授权留给用户和主 agent。

**语义触发**。主 agent 根据任务内容和 subagent description 判断是否调用某个专家。Claude Code 的普通 subagent 走这条路。description 写得越像触发条件，系统越容易在合适时机调用；写得越像愿望，越容易乱叫人。

**路由触发**。系统不看任务复杂度，先看消息从哪来。OpenClaw 按 channel、account、thread、peer、guild、role 选择 agent。Slack ops channel 进 ops agent，私人 Telegram 进 deep work agent，家庭入口进低权限 assistant。

**队列触发**。任务写进 board、queue、cron 或 background job，由 dispatcher 按状态和 assignee 拉起 worker。Hermes Kanban 走这条路。关键点不是本轮能不能返回，而是任务能不能跨 turn、跨天、跨重启、跨人类介入。

### 六种拓扑

**单 agent**。默认形态。需求模糊、修改很小、步骤强依赖时，单 agent 往往最稳。很多任务不需要多智能体，只需要更好的上下文和更短的反馈循环。

**星型 fan-out/fan-in**。最常见的 subagent 形态。主 agent 派多个 worker，worker 之间不直接协商，结果回到主 agent 做 reduce。Codex subagents、Claude 普通 subagents、Hermes delegate\_task 都是这种结构。优点是责任中心清楚，缺点是 worker 之间不能互相纠错，所有冲突都压到主 agent 的 merge 阶段。

**链式 pipeline**。适合强顺序任务。先定位 bug，再写修复，再补测试，再 review。硬把这种任务并行化，通常只会让后面的 worker 在错误假设上浪费时间。

**树型**。适合大任务分层。main agent 派 orchestrator，orchestrator 再派 leaf worker。看起来强，但要严格限制 depth 和并发，否则 fan-out 指数膨胀。OpenClaw 和 Hermes 都把默认深度压得很低，就是在控制这个风险。

**网状 team**。适合多假设问题。生产登录故障可能来自前端状态、后端 token、数据库 session、缓存或部署配置，多个 teammate 分别验证假设并互相挑战。代价：消息更多、上下文更多、协调成本更高，文件冲突也更容易出现。

**Gateway routing**。适合常驻多入口系统。不是"一个任务拆给多个 agent"，而是"不同入口进入不同 agent"。OpenClaw 的多 agent 价值很大一部分在这里。

## 调用链

{{< image src="/pictures/posts/multi-agent-delegation-chain.svg" caption="多智能体系统的调用链" width="100%">}}

把多智能体系统拆成一条调用链：

```text
input event
  -> router / dispatcher
  -> context builder
  -> worker profile selection
  -> execution sandbox
  -> state store
  -> merge / reduce
  -> final output or next task
```

**router / dispatcher** 决定是否拆任务、拆给谁。Codex 里这个判断来自用户显式授权；Claude Code 受 description 匹配影响；OpenClaw 很多时候由入口绑定决定；Hermes 里短任务可能由父 agent 调 delegate\_task，也可能由模型按复杂度自动选择。

**context builder** 决定 worker 知道什么。子 agent 上下文不够，跑偏很正常。你不能把一个 worker 拉进来只说"修一下"，然后期待它理解项目路径、错误现场、相关文件、验收标准和禁止事项。对 subagent 来说，委派信息就是需求文档。

**worker profile selection** 决定用什么角色。只读 explorer、能改代码的 worker、security reviewer、test reviewer、有长期 memory 的 profile、一次性 child——角色选错了，后面的权限和输出也会跟着错。

**execution sandbox** 决定 worker 能做什么。能不能跑 shell？能不能联网？能不能写文件？能不能继续 spawn child？这些不只是安全配置，直接改变协作模式。只读 reviewer 和可写 implementer 是两种完全不同的 agent。

**state store** 决定状态放在哪里。一次性 subagent 的状态通常只活在本轮任务里，最后返回 summary。OpenClaw 的 agent 有自己的 session store。Hermes Kanban 会把 task、comment、handoff、blocked/retry 状态写进数据库。状态放在哪里，决定了系统能不能跨 turn、跨天、跨重启。

**merge / reduce** 负责收口。多个 worker 给出结果后，谁判断冲突，谁取舍，谁写最终 patch，谁对用户负责？很多多智能体 demo 看起来漂亮，是因为跳过了 merge 难题。真实工程里，merge 才是成败的地方。

最后还有取消和失败传播。父任务被中断，子任务要不要一起停？worker 超时怎么办？两个 worker 给出相反结论怎么办？一个 worker 写了错误 patch，另一个 worker 的测试基于这个 patch 继续跑，怎么回滚？这些是运行时设计问题。

## Codex：显式 fan-out

Codex 的 subagent 策略很克制。它默认不会因为任务听起来复杂就自动开一组 agent。你需要明确给出并行授权：

```text
Use parallel subagents.
Spawn one agent per review category.
Delegate this work in parallel and synthesize the results.
```

如果你只说"深入分析一下""彻底 review 一下"，Codex 通常理解成质量要求，而不是多 agent 授权。这是一个产品取舍：Codex 把 fan-out 的控制权留给用户和主 agent，而不是把复杂度自动翻译成更多 worker。

这个设计背后有实际理由。多开 agent 增加 token、延迟、日志量和合并成本；worker 能写文件还会带来冲突风险；子 agent 返回大量解释，主 agent 的 reduce 成本变高。显式授权看起来少了一点"自动"，但系统行为可预测。

默认拓扑是星型：

```text
main Codex agent
  -> explorer A: read-only search
  -> explorer B: trace call path
  -> worker C: scoped patch
  -> reviewer D: test and risk review
  <- summaries / patch / findings
main Codex agent reduces result
```

主 agent 同时扮演 dispatcher 和 reducer。子 agent 的价值不只是"多一个脑子"，还有上下文隔离——代码库搜索、长日志、测试输出、调用链探索都可以放进子上下文，避免主上下文被噪声污染。

Codex 内置 agent 类型按责任划分：

- **explorer**：读代码、找路径、定位调用链、搜相关文件。保持只读，输出文件路径、函数名、关键证据、风险点和建议。价值在于减少主上下文探索成本，不是直接改代码。
- **worker**：改代码、补测试、实现局部功能。必须有明确 ownership，比如只改 `src/auth/*` 或只负责 `tests/auth/*`。如果两个 worker 都能改同一块逻辑，省下的时间会在冲突解决里还回去。
- **default**：通用兜底，适合边界还没完全清楚、但需要独立上下文处理的任务。越通用的 worker，越需要清楚的任务边界。

Codex 支持自定义 agent。团队可以把 TOML 放在 `.codex/agents/` 里，配置 description、model、sandbox、MCP、skills。适合把固定角色沉淀下来（security-reviewer、migration-worker、docs-editor）。但 agent 越多，调度规则越需要清楚，否则只是把 prompt 混乱从主上下文搬到了 agent 注册表。

两个关键护栏：`agents.max_threads` 控制并发宽度，`agents.max_depth` 控制递归深度。默认深度通常只允许主 agent 派子 agent，不鼓励子 agent 再开孙子 agent。一次 PR review 开安全、测试、性能三个 worker 已经够用；每个 worker 又开三个，成本和行为很快不可控。

Codex 不适合把所有复杂任务都自动拆开。小修小补不值得 fan-out；强顺序任务不适合并行；多个 worker 会写同一文件时，需要先串行设计再并行执行；需求还模糊时，多 agent 只会把模糊放大。

一个更稳健的委派示例：

```text
Use parallel subagents.

Explorer A: trace the auth request path from UI to API. Read-only.
Explorer B: inspect session persistence and cookie handling. Read-only.
Worker C: patch only src/auth/session.ts after A and B report back.
Reviewer D: review the final diff and test coverage. Read-only.

Main agent must synthesize findings, resolve conflicts, and present one final plan.
```

## Claude Code：description 驱动 + 三层结构

Claude Code 的普通 subagent 更像本地专家注册表。每个 subagent 有 name、description、system prompt、工具权限、模型和独立上下文。主 session 根据 description 判断什么时候调用，也可以被用户显式点名。

一个安全 reviewer 可以这样写：

```text
name: security-reviewer
description: Use proactively after authentication or session code changes
             to review token handling, cookie flags, expiry, and missing tests.
tools: Read, Grep, Glob, Bash
model: sonnet
```

description 是路由规则，回答"什么时候应该叫我"。写得具体，Claude 容易在合适时机调用；写得太泛（比如 "review code quality"），可能频繁出现变成噪声。

普通 subagent 生命周期短。主 session 调用它，独立上下文执行，返回摘要。不会天然变成长期角色，也不会默认和其他 subagent 协商。适合探索、审查、日志分析、局部 debug、代码库理解这类上下文噪声大的工作。

内置的 Explore、Plan、General-purpose 是三个默认 worker profile：Explore 偏只读，Plan 做研究（探索材料放子上下文避免主上下文膨胀），General-purpose 更宽可以处理多步任务。

和 Codex 的差别在触发门槛。Codex 默认等用户显式授权；Claude Code 可以根据 description 自动委派。Codex 问"用户有没有授权并行"，Claude Code 问"有没有 description 匹配当前任务"。

普通 Claude subagent 仍然是星型：

```text
main Claude session
  -> Explore
  -> security-reviewer
  -> test-reviewer
  <- summaries
main session decides next step
```

### Agent Teams：网状协作

Agent Teams 是另一套逻辑，实验功能，默认关闭。启用后，一个 lead Claude 带多个 teammate，每个 teammate 有独立上下文，可以互相通信，共享任务列表。不再是星型 fan-out，接近 team mesh：

```text
lead Claude
  <-> frontend teammate
  <-> backend teammate
  <-> database teammate
  <-> test teammate
shared task list
direct teammate messages
```

team 模式适合多假设问题。生产登录失败可能来自前端状态、后端 token、数据库 session、缓存或部署配置。一个 agent 顺着一条线查容易早早锚定；多个 teammate 分头验证再互相挑战，覆盖面更好。

代价也直接：更多上下文、更多消息、更多中间判断。teammate 可能改同一文件，可能给出冲突建议，可能在共享任务列表里制造管理负担。lead 必须有明确收口责任。没有 ownership 的 team 很容易变成"多个 session 同时忙，但没人负责最终结果"。

### 三层结构

Claude Code 可以分成三层：

**Layer 1: 普通 subagent** — description 自动路由，独立上下文，返回摘要。

**Layer 2: Agent Teams** — lead + teammates，共享任务列表，teammate 可互相通信。

**Layer 3: Agent View / worktrees / batch** — 人类调度多个 session，用 worktree 隔离写入，适合大规模机械改造。

Agent View 更像人类调度台。启动多个后台 session，观察状态，必要时插手、暂停或接管。人类参与度更高，系统不假装所有协调都由模型自动完成。

worktrees 是文件隔离手段。多个 agent 并行写同一个 repo，都在同一个工作区冲突几乎不可避免。worktree 让每个 worker 在自己的副本里改，最后再合并。

/batch 适合 repo-wide migration 或机械重构。按目录拆成多个 worktree-isolated subagents，每个 agent 负责一片区域，最后统一跑测试和 review。

Claude Code 的常见失败点来自 description 和权限边界：description 太宽会乱触发；工具权限太大会越界；team 没有 ownership 会冲突；batch 没有验收标准会产生一堆看起来完成、风格却不一致的 patch。

一个好的 description 应该像触发条件：

```text
Use after auth/session/cookie code changes.
Check token handling, cookie flags, expiry, replay risk, and missing tests.
Return findings with file paths and severity.
Do not modify files.
```

Claude Code 的主动性来自 description，可控性也取决于 description。

## OpenClaw：多入口 Gateway

OpenClaw 和 Codex、Claude Code 的出发点不同。后两者多半发生在一个 coding session 里；OpenClaw 先面对的是多渠道事件流，更像一个 self-hosted Gateway，把 WhatsApp、Telegram、Discord、Slack 等 channel 接到 agent runtime。

在 OpenClaw 里，用户发来的不一定是一个统一的"任务"。它可能来自公司 Slack 的 ops channel、私人 Telegram、Discord thread。不同入口意味着不同身份、不同权限、不同上下文和不同风险。所以 OpenClaw 的第一层不是 subagent，而是 routing：

```text
incoming message
  -> channel/account/thread/peer matching
  -> selected agent
  -> agent workspace + session store
  -> response or background task
```

可以按 peer、thread inheritance、Discord guild/role、Slack team、accountId、channel-level fallback 等规则选择 agent。消息从 Slack ops channel 来进 ops agent；从私人 Telegram 来进 deep work agent；从家庭入口来进低权限 assistant。

触发器不是用户说"开 subagent"，也不是模型看 description 自动匹配，而是事件入口绑定。OpenClaw 先回答"这条消息属于哪个 agent"，然后才谈这个 agent 要不要拆任务。

OpenClaw 里的 agent 更像隔离运行单元。一个 agent 有自己的 workspace（AGENTS.md、SOUL.md、USER.md、notes、persona rules）、自己的 agentDir（认证信息、模型 registry、per-agent config）、自己的 session store。注意边界：sub-agent auth 按 agent id 解析，但 main profiles 会作为 fallback 合并进来，所以不是"每个 agent 的认证完全硬隔离"，更准确的说法是 agent 级配置、workspace、session 和工具策略隔离。

多 agent 价值很大一部分来自隔离——入口身份隔离、上下文隔离、权限隔离、工具隔离。ops agent 可以有日志和部署工具，家庭助手不该有危险 shell 权限；deep work agent 可以记长期项目上下文，临时聊天 agent 不该共享这些状态。

第二层是 background subagent。已有 agent 可以通过 `/subagents` spawn 或 `sessions_spawn` 拉起后台 agent run。返回 run id，主对话不阻塞。子 agent 在自己的 session 里跑，完成后 announce 结果。

和 Codex 的 fan-out 相似但生命周期不同。Codex 的子 agent 更像当前任务里的并行 worker，主 agent 等结果再收口；OpenClaw 的 background subagent 更像异步 job，适合常驻聊天场景。你让它查日志、跑研究、等慢工具，主对话可以继续，不必卡在同一个 turn 里。

嵌套也允许，但默认限制很强。`maxSpawnDepth` 默认 1。提高到 2 后可以出现 orchestrator 再派 worker 的树型结构，但 child 数和并发数会被限制，depth-2 worker 不能继续 spawn。

第三层是 ACP Agents。OpenClaw 可以把外部 coding harness 接进来（Codex、Claude Code、Cursor、Gemini CLI）。用户说 "run this in Codex"，OpenClaw 可以路由到 Codex runtime。它不需要用 native subagent 覆盖所有执行场景，而是把自己变成统一入口。

三层结构：

```text
Routing layer:
  channel/account/thread/peer -> agent

Agent isolation layer:
  workspace / agentDir / session store / sandbox / tool policy

Execution layer:
  native background subagent
  or external ACP harness
```

OpenClaw 的工程重点不是"怎么让几个 agent 一起思考"，而是"怎么让不同入口、不同身份、不同权限的 agent 网络长期稳定运行"。它更像 agent 操作系统或消息网关，不是单次 coding task 的并行器。

## Hermes：短任务 RPC，长任务 durable queue

Hermes 把短程并行和长期协作拆成两个原语：delegate\_task 和 Kanban。

### delegate\_task：短程并行

父 agent 发起调用，child agent 执行，返回 summary。像 RPC。Hermes 文档说明 agent 会根据任务复杂度自动选择 delegation，但运行机制仍然是通过 delegate\_task 生成 child agent：

```text
parent agent
  -> delegate_task(goal, context)
    -> child A
    -> child B
    -> child C
  <- ordered summaries
parent continues
```

child agent 有 fresh conversation、受限工具、独立 terminal session。不知道父 agent 的全部上下文，只知道 goal 和 context 里写了什么。

文档里那句 "subagents know nothing" 很关键。子 agent 不会自动知道背景。父 agent 必须把项目路径、错误信息、相关文件、任务目标、验收标准、禁止事项和输出格式写进去。只写 "fix the error"，相当于把不完整需求丢给一个新同事。

限制明确：默认最多 3 个并发 child，超过报错不静默截断；batch 结果按输入顺序返回；父 turn 被 interrupt 时活跃 child 一起中断；默认 leaf subagent 不能再 delegate；要嵌套必须把 child 设成 orchestrator 并提高 max spawn depth。3 层深度、每层 3 并发，很快就是 27 个 leaf agents。

leaf worker 还被限制：不能再调用 delegate\_task，不能 clarify 问用户，不能写 shared persistent memory，不能跨平台发消息，不能用某些危险执行工具。短任务可以并行，但并行宽度、递归深度、工具权限和中断传播都要受控。

### Kanban：持久队列

Kanban 不是 subagent，是 durable queue 加 state machine。任务、handoff、comment 写进 SQLite task board。worker 有 profile、有名字、有 memory。dispatcher 按 assignee 拉起 worker。任务可以 block、unblock、retry，也可以等待人类输入。

两类任务的差别从生命周期看：

```text
delegate_task:
  临时 child，父 agent 等结果
  状态主要在本轮调用里
  适合几十秒到几分钟的并行研究、检查、局部修复

Kanban:
  持久 task，worker profile 接力
  状态在 board 里
  适合跨 turn、跨天、等待人类、失败重试、审计
```

三个 researcher 分别查三个资料源然后汇总，用 delegate\_task。两天的调研报告，先抓资料再分析再写稿再审校，中间可能等人类补充方向，进 Kanban。

两类任务混用是常见失败点。短任务上 Kanban 显得笨重；长任务用 delegate\_task 会丢状态、难重试、难交接。另一个失败点是 context 写得太少——Hermes 已经把风险写在文档里：child 不知道父上下文，不给足够信息就只能猜。

## 五个场景

### PR review

中等 PR，Codex 或 Claude Code 普通 subagent 都够。安全、测试、性能各开一个只读 worker，主 agent 汇总。不需要 team mesh，worker 之间不需要大量对话。更应该写清楚检查维度、输出格式和是否允许改文件。

Codex：

```text
Use three read-only subagents: security, tests, and maintainability.
Each should return findings with file paths and severity.
Do not modify files. Main agent synthesizes one review.
```

Claude Code：把 security-reviewer、test-reviewer 写成 description 驱动的普通 subagent，让它在相关代码变化后自动出现。

### 生产登录故障

适合 team 或并行探索。故障可能在前端状态、token 签发、session 存储、缓存、部署配置。Codex 显式 spawn 多个 explorer 分别查 UI、API、DB、cache，主 agent 收口。Claude Code Agent Teams 更适合让 teammate 互相挑战假设。

不建议一开始就让多个 worker 写修复。先只读并行定位，再由一个 worker 写 patch，再让 reviewer 检查。多 agent 的第一阶段应该扩大观察面，不该急着扩大写入面。

### 多渠道个人助理

不是 Codex 或 Claude Code 的主场。WhatsApp、Telegram、Slack、Discord 需要路由、入口身份隔离、权限隔离和 session store。OpenClaw 更贴这个问题。关心的不是"几个 agent 一起工作"，而是"哪个入口能触发哪个 agent、有哪些工具、状态存在哪里、凭据和工具权限怎么约束"。

合理设计：Slack ops channel 进 ops agent，拥有日志读取和低风险部署查询工具；私人 Telegram 进 deep work agent，拥有个人项目上下文；家庭入口进 low-privilege assistant，不能访问 shell 和公司账号。多 agent 首先是隔离边界，不是协作表演。

### 两天的调研报告

一次性 subagent 不够。需要任务拆分、状态记录、资料交接、人工评论、失败重试。Hermes Kanban 这类 durable board 更合适。先建 board：资料抓取、资料清洗、观点分析、初稿、审校。每个任务有 assignee、依赖、验收标准和评论区。

在某个具体任务里（比如"分别查三份官方文档"）再用 delegate\_task 开短程并行。Kanban 管生命周期，delegate\_task 管局部并行。把这两层分清，系统才不会又笨重又丢状态。

### repo-wide migration

适合 worktree + batch。按目录或模块拆，不要按"让几个 agent 自己商量"拆。每个 worker 拥有一片文件范围，最后统一跑测试和 review。Claude Code 的 worktrees / batch 更贴这个场景；Codex 也可以用 worker 分文件范围，但 ownership 必须写清楚。

常见错误是按角色拆——"一个 agent 思考，一个 agent 实现，一个 agent 测试"。对 repo-wide migration 来说，更好的拆法是按文件边界：`packages/api`、`packages/web`、`packages/shared`。文件边界比抽象角色更能减少冲突。

## 七个反模式

**把复杂度当触发器。** 任务复杂不等于应该并行。子任务强依赖时（先理解业务规则，再决定数据模型，再写迁移），那是 pipeline，不是 fan-out。

**不给 delegation contract。** worker 拿不到路径、错误现场、验收标准和禁止事项，只能猜。猜得准是运气，猜错是常态。

**让多个 worker 写同一片代码。** 多 agent 最怕并行写入但没有 ownership。必须并行写时，先按目录、模块、测试文件分边界；边界分不出来，就先不要并行写。

**没有 reducer。** 多个 agent 返回结果之后，需要有人做取舍、合并、去重、排序、验收。没有 reducer 的多 agent 只是多份意见。

**短任务做队列，长任务做 RPC。** 短任务上 durable board 会拖慢反馈；长任务用一次性 subagent 会丢状态。Hermes 把这件事分成 delegate\_task 和 Kanban，是很好的工程提醒。

**权限过宽。** review agent 不该有写文件权限；家庭入口 agent 不该有公司 shell；leaf worker 不一定需要继续 spawn child。权限越宽，调度越难预测。

**没有观测和审计。** 多 agent 系统需要知道谁触发了谁，传了什么 context，用了什么工具，返回了什么 summary，失败在哪里。否则出了问题只能看一堆聊天记录猜。

## 选择顺序

做多智能体设计时，按这个顺序问：

1. **单 agent 能不能做。** 能做就先别拆。小改动、强顺序、需求模糊时，单 agent 最稳。
2. **主上下文会不会被污染。** 长日志、大搜索、跨目录阅读、多个失败栈会让主 agent 变浑。丢给 explorer 或只读 subagent 很合理。
3. **子任务能不能独立。** 安全 review、测试 review、性能 review 可以并行；先定位 bug 再决定怎么修，更适合 pipeline。
4. **结果是否必须在本轮返回。** 必须本轮返回用 fork/join；不必本轮返回用 background job；需要跨天、重试、等待人类用 durable queue 或 Kanban。
5. **worker 是否需要互相挑战。** 只需要分头查资料，星型足够；需要互相质疑和共享任务状态，再考虑 team mesh。
6. **是否会并行写文件。** 多个 worker 会写文件时，先写 ownership。谁改哪个目录，谁只读，谁最后合并。没有这些约束就不要并行写。
7. **是否需要入口隔离。** 多渠道、多身份、多权限的系统，优先考虑 Gateway routing，而不是把所有消息丢给一个万能 agent。
8. **失败后如何恢复。** 能不能 retry？能不能 block？能不能保留 handoff？能不能看见子任务的证据？这些决定系统能不能长期运行。

## Delegation contract 模板

如果只想拿走一个实践模板：

```text
Role:
  read-only auth explorer / scoped implementation worker / security reviewer

Goal:
  要回答或完成什么，边界是什么

Context:
  项目路径、相关文件、错误信息、用户目标、已有判断

Allowed actions:
  能读哪些文件，能不能跑命令、写文件、联网

Ownership:
  如果能写，只能写哪些目录或文件

Forbidden actions:
  不要改哪些文件，不要做哪些重构，不要问用户，不要继续 spawn child

Output format:
  findings / patch summary / test result / confidence / open questions

Stop condition:
  什么情况下算完成，什么情况下停止并报告阻塞
```

这个模板解决的是多 agent 的基本问题：上下文、权限、边界、输出和收口。没有这些，再高级的拓扑都会变成随机并行。

## 各系统适用场景

Codex 适合显式、可控的星型并行。Claude Code 适合 description 驱动的专家委派，也能在 team 和 batch 场景里做更复杂的协作。OpenClaw 适合多入口、常驻、带权限隔离的 agent 网络。Hermes 适合把短程并行和长期队列分开，用 delegate\_task 管临时 fork/join，用 Kanban 管跨 turn 的工作流。

一个任务只需要更快地查四条线，用星型 subagents。一个问题需要多方互相挑战，用 team mesh。消息来自不同渠道和身份，用 Gateway routing。任务要跨天、重试、等待人类，用 durable board。多个 worker 会写同一片代码，先停下来把 ownership 写清楚。

先设计边界，再增加 agent 数量。

