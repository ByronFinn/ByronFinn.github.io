# Claude Science 逆向：从 54 张表到中药现代化


67 MB 的 DMG 安装包，解压后 164 MB，里面藏着 Anthropic 的 Claude Science（内部代号 Operon）。逆向之后，我看到了 54 张 SQLite 表、9 层安全模型、30 多个生物信息学 Skill，以及一个面向计算生物学的完整 AI Agent 平台。

TCMSP 那边，是一个正在开发中的 AI-native 中药系统药理学平台。两个项目放一起看，有些设计思路可以互相参照。

<!-- more -->

## Claude Science 不是聊天窗口

包名写得很清楚：`com.anthropic.operon`。Operon 取自生物学中的"操纵子"概念——基因调控单元。早期内部名称叫 `claude-bioscience`，定位从一开始就是生物科学。

逆向中提取的 30 多个内置 Skill 全是计算生物学和药物研发工具：

- AlphaFold2、OpenFold3、ESMFold2 —— 蛋白质结构预测
- Boltz、DiffDock —— 分子对接
- Chai1、Borzoi、ScGPT —— 蛋白质设计、基因组学、单细胞分析
- ProteinMPNN、SolubleMPNN、LigandMPNN —— 序列设计
- Figure Composer、Figure Style —— 科研绘图
- Literature Review、Indication Dossier —— 文献综述、药品申报

版本信息：`0.1.0-dev.20260630.t212931.sha2bc1ac8`，还是 dev 阶段。

## 双二进制架构

Claude Science 采用双二进制模型，189 KB 的 Swift GUI 负责界面，112 MB 的 Bun 守护进程跑所有业务逻辑。

![](/pictures/posts/claude-science-architecture.svg)

GUI 层通过 NSTask 启动守护进程，用 NSPipe 做进程间通信。守护进程通过 SecTranslocate 从 bundle 安全拷贝到隔离目录运行。窗口关了，守护进程还在后台跑。

守护进程的核心模块：

| 模块 | 能力 |
|---|---|
| Claude API 客户端 | 多模型、工具调用、Token 估算、并发控制 |
| MCP 协议连接器 | 内置 + 自定义 + 市场三种来源 |
| 远程计算引擎 | SSH/SCP、容器/VM 支持 |
| Frame 会话管理 | 分支、归档、回溯填充的对话树 |
| 制品版本管理 | AI 生成代码的版本追踪 |
| 本地记忆系统 | 跨会话持久化、自动召回、证据链 |

## 54 张表

Drizzle ORM 定义的 54 张 SQLite 表，覆盖了会话、制品、MCP、远程计算、记忆、安全审计、项目管理、用户配置、事件日志等模块。

记忆系统值得多说两句。它区分三种来源（extractor/agent_tool/user）和三种证据类型（stated/observed/inferred）。AI 能记住你说过的话，也能区分"你告诉我的"和"我观察到的"。这个设计放到需要证据分级的场景里，直接能用。

## 9 层安全模型

从代码签名到沙箱到审计日志：

1. macOS 代码签名 + SecTranslocate 安全拷贝
2. DR（Dynamic Replace）完整性验证
3. 数据目录防篡改检测（pre-upgrade plant 攻击防护）
4. 路径沙箱（allow_write 白名单）
5. 动态网络授权
6. 命令安全检查
7. 环境变量注入防护
8. MCP 工具三级授权（allow/deny/ask）
9. 主机访问授权 + 审计日志

第 3 层的 pre-upgrade plant 检测防止攻击者在用户首次运行前预置恶意数据目录。这不是理论假设，是真实出现过的攻击手法。

详细逆向报告在 [claude-science-reverse](https://github.com/ByronFinn/claude-science-reverse) 仓库里。

## TCMSP 是什么

TCMSP 是一个 **AI-native** 的中药系统药理学平台，目前正在开发中。

整个项目由 10 多个子仓库组成，分布在三层：

**数据层：**
- `tcmsp` — 核心搜索与数据 API（FastAPI + PostgreSQL），提供草药 → 成分 → 靶点 → 疾病的完整数据链路
- `tcmsp-cms` — 内容管理后端（临时过渡），管理文章、公告、专利等内容
- `tcmsp-prds` — PRD 草稿、路线图

**调度层：**
- `tcmsp-ai` — AI 编排服务，是项目的大脑

**计算层：**
- `modules/` — 计算模块集合：分子对接、分子动力学、富集分析、单细胞分析、毒性预测等

**用户层：**
- `tcmsp-desktop` — 桌面端（Tauri + Rust + Vue）
- `tcmsp-web` — 公开前端
- `tcmsp-admin-web` — 管理后台
- `tcmsp-cms-web` — CMS 前端
- `tcmsp-ums` — 用户管理与认证（Casdoor OIDC）

### 数据模型

数据模型围绕多对多关系设计——药材 ↔ 成分 ↔ 靶点 ↔ 疾病，每种关系都有独立的关联表，支撑多跳查询。以 `tcmsp` 仓库的数据模型为例，核心实体有 `草药`、`化学成分`、`蛋白靶点`、`疾病`等以及它们的关联表。

查询链路就是科研链路：找某药材的化学成分 → 这些成分作用的蛋白靶点 → 这些靶点关联的疾病 → 反向分析。

### 调度层

`tcmsp-ai` 才是项目的核心。它提供了一系列 API：

- 模块推荐与探索（`/exploration`、`/extraction`）
- 分子对接（`/molecular-docking`）
- 分子属性预测（`/molecule-properties`）
- 分子毒性预测（`/molecule-toxicities`）
- 研究会话（`/sessions`）
- 论文生成（`/papers`）
- 门控决策（`/gates`）
- 研究分流（`/research-triage`）

### 计算模块

`modules/` 目录下是实际的计算模块，包括：

- **分子对接**（molecular_docking）— 基于 AutoDock Vina 的小分子-蛋白对接
- **分子动力学**（molecular_dynamics）— GROMACS 的动力学模拟
- **化合物属性分析**（compound_property_analysis）
- **富集分析**（enrichment_pipeline）
- **分子属性服务**（molecule_property_service）— ML 模型预测
- **单细胞分析**（single_cell_plot）
- **毒性预测**（venompred_toxicity_service）
- **虚拟敲除**（virtual_knockout_service）— 基因级模拟

## Agent Runtime：最值得看的部分

`tcmsp-ai` 里的 Agent Runtime 是项目最有意思的部分。它有一套完整的动态 Agent 执行引擎：

```
用户输入 → 模块推荐 → 研究探索 → 计划生成 → 计划审批 →
步骤执行（并行调度）→ 门控决策 → 结果产出 → 论文生成
```

**DynamicAgentExecutor** 是核心执行器。它接收一个 `dynamic_agent_plan`，按依赖拓扑排序步骤，分批并行执行。步骤分三类：module step（调用计算模块）、gate step（等待人类审批）、template service step（模板服务）。

**Gate 系统** 是人与 AI 协作的关键节点。支持多种审批类型：

- **plan_confirmation** — 用户审批研究计划
- **cost_approval** — 成本审批（可全部批准、子集批准或跳过）
- **scientific_selection** — 科学选靶（用户从 AI 推荐中筛选靶点）
- **claim_review** — 研究发现审核
- **pipeline_review** — 流程审核
- **failure_recovery** — 失败恢复（重试、调整后重试或放弃）

每个 gate 的决策都通过 `GateDecisionHandler` 验证，然后由 `GateEffectApplier` 应用到执行上下文。决策可以修改计划、调整步骤、甚至中断执行。

**StepScheduler** 用 Kahn 算法做拓扑排序，把无依赖的步骤分组并发执行。这样分子对接、属性预测、毒性预测可以并行跑，不互相阻塞。

## Claude Science 的架构能给 TCMSP 什么启发

逆向 Claude Science 之后，回头看 TCMSP 的设计，有几个对比值得记录：

**记忆系统的证据分级。** Claude Science 区分 stated/observed/inferred。TCMSP 的模块系统里，Agent Manifest 已经定义了 `evidence_type` 和 `confidence_fields`，但没有做跨会话的记忆持久化和证据追踪。这可以是下一个迭代的方向。

**MCP 协议 vs modules 系统。** Claude Science 通过 MCP 协议连接外部工具。TCMSP 用的是 registry + runner 模式——模块注册到 registry，RunnerSpec 定义执行方式（python_runtime、docker、http_api 等）。两者思路类似，但 MCP 更通用，TCMSP 的模块系统更贴近中药计算场景。如果 TCMSP 后续需要接入外部工具，MCP 协议层是一个可以考虑的方案。

**Frame 会话 vs 研究会话。** Claude Science 的 Frame 支持对话分支。TCMSP 的 Research Session 也有类似概念——支持多轮探索、推荐模块、执行 pipeline，但目前没有分支能力。

## 现状

TCMSP 还在开发中。从 PRD 看，远期目标包括：中药系统药理科研智能体、民族药多尺度机制解析、复方新适应症预判、病证驱动智能组方、功效成分发现与结构优化等。Desktop 端也有独立的商业路线图。

AI Agent 正在从通用编程工具演变为领域专用科研平台。Claude Science 从生物科学切入，TCMSP 从中药系统药理学切入，路径不同，方向一致。

TCMSP 官网：[https://tcmsp-e.com/](https://tcmsp-e.com/)

---

*基于对 Claude Science v0.1.0-dev.20260630 的逆向分析。*

