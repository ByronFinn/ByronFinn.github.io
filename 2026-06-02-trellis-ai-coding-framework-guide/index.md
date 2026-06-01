# Trellis 做了什么，能不能解决 AI 编码的规范问题


用 AI 写代码，最烦的不是它写错，而是它每次都用不同的方式写错。同一个需求，对话三次，三种写法。规范在你脑子里，AI 不知道。

<!-- more -->

Trellis 试图解决这个问题。它不是又一个 AI 编码助手，而是一套给 AI 注入项目规范的框架——让 AI 写代码之前先读你的规范，写完之后自动检查，检查完之后把新学到的东西沉淀回规范里。用得越多，AI 越懂你的项目。

这篇文章把 Trellis 的核心机制、跟同类工具的差异、实际工作流和真实案例讲清楚。

## AI 编码的三个痛点

先说问题。目前 AI 编码有三个绕不过去的毛病：

**Vibe Coding**：AI 每次对话都是"新来的"。你让它写个登录模块，第一次用 JWT，第二次用 Session，第三次可能直接把密码存明文了。不是 AI 不会，是你没告诉它标准是什么——但你没法每次都重新解释一遍。

**上下文丢失**：新会话一开，AI 失忆了。上次改了哪些文件、用了什么架构、遇到了什么坑，全部清零。你得反复说"我们项目用的是 Next.js App Router"、"错误处理统一用 toApiError()"。

**规范碎片化**：项目规范散落在 PR 评论、Slack 消息、资深同事的脑子里。AI 无从得知这些隐含约定，你也很难每次都手动喂给它。

这三个问题的根源是一样的：**AI 没有项目记忆，也没有规范约束**。代码不是资产，规范才是资产——但大多数团队的规范只存在于人脑中。

---

## Trellis 是什么

一句话：Trellis 是 AI 的脚手架。

它通过自动化机制注入项目规范，引导 AI 沿着规范的路径写代码。具体来说：

- 支持 14+ AI 编码平台（Claude Code、Cursor、OpenCode、Codex、Gemini CLI、Windsurf、Kiro、Copilot 等）
- 通过 Workspace Journal 做跨会话持久化，让 AI 记住上次做了什么
- Auto-trigger Skill + Check Sub-agent 验证循环，固化工作流
- Git 版本化的 Spec 库，团队级共享与复用
- Spec 随项目成长——用得越多，AI 越懂你

{{< image src="/pictures/note/trellis-core-concepts.svg" alt="Trellis 四大核心概念" caption="Trellis 的四大核心概念：Spec 提供标准，Workspace 保持记忆，Task 驱动执行，Skill 自动化流程" >}}

---

## 跟 OpenSpec、Superpowers 的差异

市面上不只有 Trellis。OpenSpec（51.3k stars）和 Superpowers（210.2k stars）也在做类似的事。它们不差，但解决的是不同层面的问题。

**OpenSpec** 的思路是"先达成共识再写代码"。四阶段工作流（Propose → Review → Apply → Archive），Spec 存在 Git 里可以跨会话读取。但它没有开发者个人记忆层，没有 Auto-trigger 自动工作流，也没有结构化任务系统——靠手动斜杠命令驱动。

**Superpowers** 的思路是"给 AI 注入工程技能"。SKILL.md 可跨项目共享，强制 Brainstorm → Plan → TDD → Review 流程。但它没有项目级 Spec 管理，没有 Workspace 持久化日志，流程严谨但 overhead 较高。

**Trellis** 试图兼得：Spec 驱动（类似 OpenSpec）+ 工程技能（类似 Superpowers）+ 跨会话记忆（独有）+ 任务生命周期管理 + Sub-agent 并行架构 + 团队 Git 版本化共享。

| 维度 | OpenSpec | Superpowers | Trellis |
| --- | :---: | :---: | :---: |
| **规范管理** | Spec 库 | 无 | Spec 分层 + 自更新 |
| **工程技能** | 手动命令 | TDD / 规划 / 审查 | Auto-trigger Skill |
| **跨会话记忆** | Spec 文档持久化 | 无 | Spec + Workspace Journal |
| **任务管理** | 四阶段流程 | 无 | 完整生命周期 + Hook |
| **Sub-agent** | 无 | 子代理开发 | Research / Implement / Check |
| **团队共享** | Git + delta | 通用 Skill 共享 | 项目专属 Spec + Registry |
| **平台支持** | 20+ 工具 | 6+ 工具 | 14+ 深度集成 |

最佳实践是 Trellis（规范 + 工作流）配合 GitNexus（代码结构感知），组成完整的 AI 工程方案。后面会讲 GitNexus 的集成。

---

## 四个核心概念

Trellis 的运行依赖四个东西，它们跨平台一致。

### 1. Spec（规范）

`.trellis/spec/` 目录，用 Markdown 写你的编码标准。按模块分文件（frontend / backend / guides），AI 写代码前先读规范。

Spec 不是写给人看的文档，是写给 AI 看的指令。每条规范应该引用具体文件路径，贴项目里真实的代码示例。"建议使用 X"这种废话没用，要说"在 `src/api/` 下用 `toApiError()` 处理错误"。

### 2. Workspace（工作区）

`.trellis/workspace/` 目录，每个开发者的会话日志（Journal）。让 AI 跨会话记住上次做了什么，保持上下文连贯。

这是 Trellis 区别于其他工具的关键。Spec 是团队共享的规范，Workspace 是个人的工作记忆。两者配合，AI 既知道项目的标准，也知道你最近在忙什么。

### 3. Task（任务）

`.trellis/tasks/` 目录，工作单元。每个 Task 包含 PRD、上下文配置（JSONL）、子任务。完整生命周期：创建 → 规划 → 执行 → 验证 → 归档。

Task 让 AI 的工作有迹可循。不是"对话一关就没了"，而是有结构化的记录，可以回溯、可以交接。

### 4. Skill（技能）

`.agents/skills/` 目录，Auto-trigger 工作流模块。平台根据上下文自动触发，无需显式命令。

五个内置 Skill：

| Skill | 触发时机 | 做什么 |
|---|---|---|
| `trellis-brainstorm` | 用户描述需求时 | 一问一答澄清需求，起草 PRD |
| `trellis-before-dev` | 动手改代码前 | 读取受影响模块的 Spec 和 checklist |
| `trellis-check` | 实现完成后 | 对照 Spec 审查 diff，运行 lint/test |
| `trellis-update-spec` | 有值得沉淀的知识时 | 将经验固化为 Spec 中的规则 |
| `trellis-break-loop` | 修完棘手 bug 后 | 五维根因分析：分类 → 原因 → 预防 → 扩散 → 固化 |

`trellis-break-loop` 是个有意思的设计。修 bug 不只是改代码，而是要回答五个问题：这是什么类型的 bug？为什么发生？怎么预防？影响范围多大？学到什么要写进 Spec？这个循环确保 bug 不只是被修了，而是被理解了。

---

## 日常使用：三个命令

Trellis 0.5.0 采用 Skill-first 架构，用户只需记住三个命令：

**`/trellis:start`** — 开启会话。读取 workflow.md 工作流契约，获取身份、git 状态、活跃任务和 Spec 索引。支持 Hook 的平台会自动触发。

**`/trellis:continue`** — 推进下一步。AI 自动判断当前处于什么阶段（brainstorm → implement → check），你不需要记忆工作流的各阶段。一路对话 + continue 即可。

**`/trellis:finish-work`** — 收尾归档。前提是代码已 commit。归档活跃任务，追加 Journal 记录，产出 chore commits。

典型流程：描述需求 → AI brainstorm → `continue` → 实现 → `continue` → 检查 → `finish-work`。

{{< image src="/pictures/note/trellis-workflow.svg" alt="Trellis 日常工作流" caption="Trellis 的日常工作流：start → 描述需求 → 实现 → 检查 → 沉淀，continue 推进每一步" >}}

---

## 安装与初始化

系统要求：Node.js 18+ 和 Python 3.9+。Mac / Linux / Windows 全支持。

```bash
# 全局安装
npm install -g @mindfoldhq/trellis

# 进入项目目录并初始化
cd your-project && trellis init -u your-name

# 或显式指定平台
trellis init -u your-name --claude --cursor --windsurf

# 使用远程 Spec 模板
trellis init -u your-name --template electron-fullstack

# 使用团队自定义 Registry
trellis init --registry gh:myorg/myrepo/specs
```

Init 会根据场景自动分派：首次 init 创建骨架 + bootstrap 任务，新开发者加入时生成 joiner 引导任务，已有项目加平台时铺设配置。

---

## Trellis + GitNexus 集成

GitNexus（40.5k stars）是零服务器代码知识图谱引擎，基于 Tree-sitter AST + Graph RAG + 16 个 MCP Tools，完全本地运行。

Trellis 管规范，GitNexus 管代码结构。两者配合的效果是：AI 不只知道"应该用 `toApiError()` 处理错误"，还知道"改这个函数会影响 47 个调用方"。

```bash
# 安装与索引
npm install -g gitnexus
cd your-project
gitnexus analyze              # 全量索引（AST + 依赖 + 调用链）

# 接入 AI 编码工具（MCP）
claude mcp add gitnexus -- gitnexus mcp   # Claude Code
codex mcp add gitnexus -- gitnexus mcp    # Codex

# Trellis 初始化
trellis init -u your-name --claude
```

GitNexus 提供五个核心能力：
- `analyze` — Tree-sitter AST 全量索引
- `impact` — Blast Radius 变更影响分析
- `context` — 360° 符号视图（谁调用了这个函数，这个函数又调用了谁）
- `detect-changes` — Git diff → 受影响符号映射
- `mcp` — MCP 服务器供 AI 直接查询

在大型项目重构时，这个组合特别有用。AI 在实现过程中会自动调用 `gitnexus impact <symbol>` 查看变更影响范围，然后用 `trellis-check` 对照 Spec + blast radius 验证。

---

## 七个真实场景

Trellis 官方文档给了 7 个端到端案例。挑几个有意思的展开讲。

### 修复反复出现的 Bug

真实案例：Claude Code 的 SessionStart hook 崩溃，报错 `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`。

表面原因是 `str | None` 语法不兼容 Python 3.9。但真正根因是：AI CLI 启动 hook 子进程时 PATH 极简，`python3` 解析到系统自带 3.9，而不是用户配置的 3.11。

Trellis 的处理方式是七步闭环：

1. `brainstorm` 讨论复现条件与根因方向 → prd.md
2. 配置 check.jsonl 引用相关 Spec
3. `implement`：最小改动止血，先加回归测试
4. `check`：确认 patch 修复 + 无 patch 时回归测试失败
5. `break-loop`：五维根因分析 → 确认能否防复发
6. `update-spec`：预防动作写入 Spec / checklist
7. `finish-work` 归档 + Journal 记录

完成标准不只是"bug 修了"，而是：patch 修复行为 + 无 patch 回归测试失败 + 根因记录在案 + 预防措施落到 Spec/test/checklist。下次 AI 遇到类似场景，会自动检查 PATH 配置。

### 减少重复的 Code Review

Reviewer 总是在写同类评论："缺少 loading 状态"、"不要用 any"、"错误格式不一致"、"已有现成 helper 你不用"。

Trellis 的做法是把这些 Review 反馈映射成 Spec 规则：

| Review 反馈 | Spec 规则 |
|---|---|
| "缺少 loading" | 异步按钮必须有 idle / loading / success / error 四态 |
| "不要用 any" | 公共组件 props 禁用 any，用显式接口或泛型 |
| "错误格式不一致" | 所有 route handler 通过 `toApiError()` 返回标准格式 |
| "已有现成 helper" | 添加格式化前先搜索 `src/lib/formatters/` |

流程是：粘贴 PR 链接 → brainstorm 讨论哪些 pattern 值得固化 → 从真实 PR 收集重复反馈 → `update-spec` 写入规则（每条配 good/bad 代码示例）→ 下一个任务中验证 → 跑 1-2 个真实任务后回看，删掉没抓到问题或产生噪音的规则。

效果是 Reviewer 可以在 PR 里引用 `.trellis/spec/`，不用每次重新解释约定。

### 存量项目接入

代码库已存在三年，规范散落在历史 PR、Reviewer 习惯和资深同事的记忆里。接入步骤：

1. `trellis init` → 生成默认 Spec 模板 + `00-bootstrap-guidelines` 引导任务
2. Bootstrap 任务中 AI 扫描仓库提取真实模式（API routes、auth、logging、forms）
3. 要求 AI 为每条规范引用具体文件路径，删掉不能追溯的规则
4. 像 Review 代码一样 Review Spec，选试点 task 验证效果

好的 Spec 特征：写真实路径，贴项目里真实的代码示例，说清 API 签名、字段类型、环境变量、错误类型，一个 spec 文件只写一个主题。**空模板比错误模板危害更小**——如果一条规范没有真实代码可以引用，宁可不写。

### 重构老模块

`src/billing/invoice-service.ts` 1200 行——计算账单、处理折扣、调用支付 API、写审计日志、做邮件格式化。

重构前先写不变量（写入 PRD，人工确认）：
- Invoice totals 必须与现有计算匹配
- 失败支付尝试必须仍然写入审计日志
- 邮件渲染输出与现有模板字节级兼容
- 公共 API 响应形状不能改变

然后逐层安全拆分：先加 characterization tests 跑通基线，再**一次只抽取一个职责**，公共接口保持稳定。每轮跑测试确认行为不变，不过就 rollback。

原则：先加测试保行为，再逐层拆分，每一步都可安全回退。

---

## Spec 模板自定义

模板不是拿来就用的。每个项目都该裁剪和扩展成自己的规范。

三种获取方式：
- `trellis init` — 默认内置模板
- `--template` — 官方模板（Electron / Next.js / CF Workers）
- `--registry` — 团队自定义 Git 仓库（v0.3.6+）

模板目录结构：

```
spec/
├── frontend/
│   ├── index.md
│   ├── components.md
│   ├── hooks.md
│   └── state-management.md
├── backend/
│   ├── index.md
│   └── ...
├── guides/
│   ├── index.md
│   └── ...
└── README.md
```

自定义 Registry 支持两种模式：Marketplace 模式（仓库含 `marketplace/index.json`，列出模板索引供选择）和直接下载模式（整个 `marketplace/specs/` 作为单个模板下载）。支持 GitHub / GitLab / Bitbucket。

渐进式填写：不需要一次填完所有 spec 文件。先从对你项目最重要的部分开始，Bootstrap 任务会引导你逐步完成。

---

## 团队推广路径

从个人试点到 50 人团队标准化，五个阶段：

1. **试点一个仓库** — 用 specs / checks / journal 完成一个真实任务
2. **捕获重复反馈** — 三到五条 Review 模式被沉淀进 specs
3. **标准化任务工作流** — 开发者熟悉 /start、/continue、/finish-work 各自时机
4. **增加平台适配** — 多 AI 工具消费同一套 `.trellis/` 上下文
5. **治理更新** — Spec 和 workflow 变更都像代码一样被 Review

每个阶段有明确的退出标准。不要跳步——第一个阶段没跑通就不要推广到团队。

---

## 实际体验的几个点

说了这么多机制，讲几个实际感受：

**Spec 的质量决定一切。** Trellis 的所有自动化都建立在 Spec 写得好这个前提上。Spec 写得模糊，AI 执行得也模糊。花时间打磨 Spec 是值得的。

**跨会话记忆确实有用。** 不用每次重新解释"我们项目用什么框架"、"错误怎么处理"，省的不只是时间，还有心力。

**不要过度依赖自动化。** `trellis-check` 能抓到很多问题，但不是所有问题。它抓的是 Spec 里写了的问题——没写进 Spec 的，它不知道。人工 Review 仍然必要。

**GitNexus 是加分项，不是必需品。** 小项目用不上代码知识图谱。大型项目重构时才有明显收益。

---

## 开始用

```bash
npm install -g @mindfoldhq/trellis
```

- [官方文档（中文）](https://docs.trytrellis.app/zh)
- [GitHub 仓库](https://github.com/mindfold-ai/Trellis)
- [GitNexus](https://github.com/nicholasgriffintn/gitnexus)

Trellis 不是银弹。它解决的是"AI 不知道你的规范"这个问题，但前提是**你得有规范可写**。如果项目本身没有明确的编码标准，Trellis 帮不了你——它只是个传递规范的管道，不是规范的来源。

但如果你的团队已经有了规范，只是散落在各处、每次都要手动解释，那 Trellis 值得试一试。

