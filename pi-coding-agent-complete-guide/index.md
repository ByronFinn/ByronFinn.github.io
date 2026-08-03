# Pi Coding Agent 完全指南：极简主义 Coding Agent 的终极玩法


<!-- more -->

## 前言

按照作者的话来说，Pi Coding Agent 是一个**有主见且极简**的 Coding Agent。上手了一段时间后，我认为它是目前最好用的 AI Agent CLI 之一。

很多项目爆火后都会迎来各种低质量的 issues 和 AI 生成的 PR，而 **pi** 这个名字非常有意思——它会与数学常数产生关联，这正是作者有意为之，目的是降低知名度，保持社区质量。

## 设计理念

> 翻译自 [官方文档](https://pi.dev/docs/latest/usage)

Pi 奉行近乎**激进的可扩展性**，因此无需、也不愿替你规定工作流。许多在别的工具中"内建"的能力，在这里都可通过 extensions、skills 或安装第三方 pi packages 来实现。核心保持精简，你按自己的工作方式塑造 Pi。

Pi **有意不包含**以下功能，但你完全可以通过扩展或外部工具实现：

- **不做 MCP。** 你可以构建带有 README 的 CLI 工具（见 Skills），也可以编写 extension 为 Pi 增加 MCP 支持。
- **不设 sub-agents。** 可借助 tmux 启动多个 Pi 实例，或用 extensions 自行搭建。
- **不弹 permission popups。** 可以在容器中运行，或通过 extensions 构建与自身安全要求匹配的确认流程。
- **不设 plan mode。** 计划可直接写入文件，或借助 extensions 自行实现。
- **不内置 to-dos。** 它们容易让模型困惑。请使用 `TODO.md` 或用 extensions 自定义。
- **不提供后台 bash。** 请使用 tmux——全程可观测，交互更直接。

设计哲学的详细论述见[作者博文](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)，写得非常精彩。

## 快速上手

使用过程中有困难可以查阅 [DeepWiki](https://deepwiki.com)。

## 安装

**方式一：curl（Linux / macOS）**

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

**方式二：npm**

```bash
npm install -g @earendil-works/pi-coding-agent
```

接着通过 `pi` 命令启动，或为你的终端配置快捷键。

### Windows

Windows 用户还需要一个 bash shell。检查顺序：

1. `~/.pi/agent/settings.json` 中的自定义路径
2. Git Bash（`C:\Program Files\Git\bin\bash.exe`）
3. PATH 中的 `bash.exe`（如 Cygwin, MSYS2, WSL）

对于大多数用户，[Git for Windows](https://git-scm.com/download/win) 足够了。

自定义 Shell 路径（`settings.json`）：

```json
{ "shellPath": "C:\\cygwin64\\bin\\bash.exe" }
```

### Termux（Android）

详见[官方文档](https://pi.dev/docs/latest/termux)。

## 模型配置

配置好后可以通过 `/model`（或 `Ctrl+L`）选择模型。

### 订阅

对于具有以下订阅之一的用户：

- Claude Pro/Max
- ChatGPT Plus/Pro（Codex）
- GitHub Copilot

可通过 `/login` 进行登入，使用 `/logout` 登出。认证 Token 会被储存在 `~/.pi/agent/auth.json`。

### API 密钥

可通过环境变量设置：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

或写入 `~/.pi/agent/auth.json`：

```json
{
  "anthropic": { "type": "api_key", "key": "sk-ant-..." },
  "openai": { "type": "api_key", "key": "sk-..." },
  "google": { "type": "api_key", "key": "..." },
  "opencode": { "type": "api_key", "key": "..." }
}
```

**支持的 API 密钥提供商：**

| 供应商 | 环境变量 | `auth.json` 键 |
|--------|---------|---------------|
| Anthropic | `ANTHROPIC_API_KEY` | `anthropic` |
| Azure OpenAI Responses | `AZURE_OPENAI_API_KEY` | `azure-openai-responses` |
| OpenAI | `OPENAI_API_KEY` | `openai` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek` |
| Google Gemini | `GEMINI_API_KEY` | `google` |
| Mistral | `MISTRAL_API_KEY` | `mistral` |
| Groq | `GROQ_API_KEY` | `groq` |
| Cerebras | `CEREBRAS_API_KEY` | `cerebras` |
| xAI | `XAI_API_KEY` | `xai` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway` |
| ZAI | `ZAI_API_KEY` | `zai` |
| OpenCode Zen | `OPENCODE_API_KEY` | `opencode` |
| OpenCode Go | `OPENCODE_API_KEY` | `opencode-go` |
| Hugging Face | `HF_TOKEN` | `huggingface` |
| Fireworks | `FIREWORKS_API_KEY` | `fireworks` |
| Together AI | `TOGETHER_API_KEY` | `together` |
| Kimi For Coding | `KIMI_API_KEY` | `kimi-coding` |
| MiniMax | `MINIMAX_API_KEY` | `minimax` |
| MiniMax（中国） | `MINIMAX_CN_API_KEY` | `minimax-cn` |

默认情况下 `auth.json` 以 `0600` 权限创建（仅用户可读写）。**Auth 文件凭证优先于环境变量。**

### 第三方提供商

通过 `~/.pi/agent/models.json` 添加自定义提供商和模型（Ollama、vLLM、LM Studio、代理等）。

**完整示例：**

```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434/v1",
      "api": "openai-completions",
      "apiKey": "ollama",
      "models": [
        {
          "id": "llama3.1:8b",
          "name": "Llama 3.1 8B (Local)",
          "reasoning": false,
          "input": ["text"],
          "contextWindow": 128000,
          "maxTokens": 32000,
          "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 }
        }
      ]
    }
  }
}
```

**支持的 API 类型：**

| API | 描述 |
|-----|------|
| `openai-completions` | OpenAI Chat Completions（最兼容） |
| `openai-responses` | OpenAI Responses API |
| `anthropic-messages` | Anthropic Messages API |
| `google-generative-ai` | Google Generative AI |

- 在 `providers` 层级设置的 `api`，作为该 provider 下所有 models 的默认值。
- 在 `models` 层级中，单个模型可以通过自己的 `api` 字段覆盖默认值。
- 如遇 `Error: 403 Your request was blocked`，说明请求被 CF 阻断。自定义请求头加上 UA 即可：

```json
"headers": {
  "User-Agent": "MyCustomClient/1.0"
}
```

每次在 Pi 中键入 `/model` 时，文件都会重新加载，因此编辑 `models.json` 无需重启。

## 指南

详见[官方文档](https://pi.dev/docs)

![Pi TUI](/pictures/note/pi-tui.png)

感受一下 TUI 界面。你可以编写主题和扩展进行自定义，甚至让 Pi 看起来完全不同。

### 编辑器

| 功能 | 用法 |
|------|------|
| 文件引用 | 输入 `@` 可模糊搜索项目文件 |
| 路径补全 | 按 `Tab` 自动补全路径 |
| 多行输入 | `Shift+Enter`（Windows Terminal 下可用 `Ctrl+Enter`） |
| 图片 | `Ctrl+V` 粘贴（Windows 下可用 `Alt+V`），或直接拖到终端 |
| Shell 命令 | `!command` 执行并把输出发给模型 |
| 隐藏 Shell 命令 | `!!command` 执行但不发送输出 |
| 外部编辑器 | `Ctrl+G` 打开 `$VISUAL` 或 `$EDITOR` |

删除单词、撤销等使用标准编辑快捷键。详见 [Keybindings](https://pi.dev/docs/latest/keybindings)。

### 命令

在编辑器里输入 `/` 可触发命令。扩展可注册自定义命令，技能可用 `/skill:name` 调用，提示词模板可通过 `/templatename` 展开。

| 命令 | 说明 |
|------|------|
| `/login`, `/logout` | OAuth 登录/退出 |
| `/model` | 切换模型 |
| `/scoped-models` | 启用/禁用 `Ctrl+P` 轮换可选模型 |
| `/settings` | 设置思考等级、主题、消息投递、传输方式 |
| `/resume` | 从历史会话中恢复 |
| `/new` | 新建会话 |
| `/name <name>` | 设置会话显示名称 |
| `/session` | 显示会话信息（路径、Token、费用） |
| `/tree` | 跳转到会话任意节点并从那继续 |
| `/fork` | 从之前的用户消息创建新会话 |
| `/clone` | 将当前活动分支复制到新会话 |
| `/compact [prompt]` | 手动压缩上下文，可自定义压缩提示 |
| `/copy` | 复制助手上一条回复到剪贴板 |
| `/export [file]` | 导出会话为 HTML 文件 |
| `/share` | 上传为私有 GitHub Gist，并生成可分享 HTML 链接 |
| `/reload` | 重载扩展、技能、提示词、上下文文件（主题会自动热更新） |
| `/hotkeys` | 显示全部快捷键 |
| `/changelog` | 显示版本更新记录 |
| `/quit` | 退出 pi |

### 消息队列

智能体工作时，你也可以继续发消息：

- **Enter**：排入一条**引导消息**，在当前助手回合完成工具调用执行后立即送达
- **Alt+Enter**：排入一条**跟进消息**，在代理完成全部工作后送达
- **Escape**：中止当前过程，并把已排队消息恢复到编辑器
- **Alt+Up**：把队列中的消息取回到编辑器

可在 Settings 配置投递方式：`steeringMode` 和 `followUpMode` 可设为 `"one-at-a-time"`（默认，收到回复后再发下一条）或 `"all"`（一次性发送队列全部消息）。`transport` 用于选择支持多传输的提供方通道偏好（`"sse"`、`"websocket"` 或 `"auto"`）。

### 会话

会话以 JSONL **树结构**保存。每条记录都有 `id` 和 `parentId`，所以可以在同一个文件里直接分支，不必新建文件。

#### 管理

会话自动保存到 `~/.pi/agent/sessions/`，并按工作目录分组。

```bash
pi -c                  # 继续最近一次会话
pi -r                  # 浏览并选择历史会话
pi --no-session        # 临时模式（不保存会话）
pi --session <path|id> # 使用指定会话文件或会话 ID
pi --fork <path|id>    # 将会话分支到新会话文件
```

#### 分支

- **`/tree`**：在当前会话文件内浏览会话树。选中任意历史节点，从那继续，所有分支都保留在同一会话文件中。输入关键词可搜索，`←`/`→` 翻页。过滤模式（`Ctrl+O`）：default → no-tools → user-only → labeled-only → all。按 `l` 可给条目标记书签。
- **`/fork`**：从之前的用户消息创建一个新会话文件。系统会打开选择器，复制到所选节点为止的历史，并把该节点消息放入编辑器。
- **`/clone`**：将当前活动分支复制到新会话文件。

### 设置

使用 `/settings` 修改常用选项，或直接编辑 JSON 文件：

| 位置 | 范围 |
|------|------|
| `~/.pi/agent/settings.json` | 全局 |
| `.pi/settings.json` | 项目 |

详见[官方文档](https://pi.dev/docs/latest/settings)。

### 项目上下文

Pi 在启动时会从以下位置加载 `AGENTS.md`（或 `CLAUDE.md`）：

1. `~/.pi/agent/AGENTS.md`（全局）
2. 父目录（从当前工作目录向上查找）
3. 当前目录

用于项目说明、约束和常用命令封装。所有匹配的 md 文件将被拼接在一起。

### 系统提示

- 用 `.pi/SYSTEM.md`（项目）或 `~/.pi/agent/SYSTEM.md`（全局）**替换**系统提示词
- 用 `APPEND_SYSTEM.md` 在系统提示词末尾**追加**内容，而不替换

## 自定义

这部分的内容都可以封装为 pi package。公开的 Pi 包见 [Packages - pi.dev](https://pi.dev/packages)。

### 提示词模板

将提示词封装为 Markdown 文件，输入 `/文件名` 展开。

```markdown
<!-- ~/.pi/agent/prompts/review.md -->
Review this code for bugs, security issues, and performance problems. Focus on: {{focus}}
```

放置在 `~/.pi/agent/prompts/`（全局）、`.pi/prompts/`（项目）或封装为 pi package 分享。

### 技能

按需加载的技能包，遵循 [Agent Skills 标准](https://docs.anthropic.com/en/docs/claude-code/skills)。可通过输入 `/skill:name` 调用，也可让 Agent 自动加载。

```markdown
<!-- ~/.pi/agent/skills/my-skill/SKILL.md -->
# My Skill
Use this skill when the user asks about X.

## Steps
1. Do this
2. Then that
```

安装路径：

- **全局**：`~/.pi/agent/skills/`、`~/.agents/skills/`
- **项目**：`.pi/skills/`、`.agents/skills/`（从当前工作目录向上逐级查找父目录）

或封装为 pi package。详见[官方文档](https://pi.dev/docs/latest/skills)。

### 扩展

用 TypeScript 编写扩展，为 Pi 添加工具、命令、事件和自定义 UI。

放入 `~/.pi/agent/extensions/`（全局）、`.pi/extensions/`（项目）或封装为 pi package。

参见[文档](https://pi.dev/docs/latest/extensions)和[示例](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions)。

### 主题

内置暗色与明亮，修改主题配置后可热重载。

放入 `~/.pi/agent/themes/`（全局）、`.pi/themes/`（项目）或封装为 pi package。

详见[官方文档](https://pi.dev/docs/latest/themes)。

### Pi Packages

将扩展、技能、提示词和主题打包为 npm/git 包，一键安装和分享：

```bash
pi install <source>     # 全局安装
pi install <source> -l  # 项目本地安装
pi list                  # 列出已安装的包
pi config                # 启用/禁用包资源
```

---

通过扩展与主题系统可以极大增强使用体验。直接对模型说出需求即可——Pi 的系统提示词中包含了文档路径，模型能够理解并使用这些自定义能力。

