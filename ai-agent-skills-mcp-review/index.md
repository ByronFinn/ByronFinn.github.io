# AI Agent 的 Skill 和 MCP，哪些值得装


先说结论：市面上能装的工具不少，但大多数装完就放着吃灰了。下面是从我自己在用的东西里筛出来的，按场景分了五类，每类列几个真实用过的。

<!-- more -->

## 先推荐一个综合的

如果你想装一个就能覆盖大部分场景的，可以看这个：

**dev-skills**，地址：https://github.com/ByronFinn/dev-skills

一套工程全流程的 Skill 集，从想法到发布都覆盖了。不像单个工具只解决一个点，它把链路串起来了：`/think` 想清楚方案 → `/grill` 压力测试 → `/story` 切成可执行的 Issue → `/implement` 按 seam 推进 → `/review` 并行审查。每个 Skill 独立可跑，但组合起来效果更好。我之前写过一篇 {{< ref "posts/2026-06-22-claude-code-skills-system" >}}，里面拆了 Skill 的加载和执行机制，跟这个是同一套思路。

它自己的文档就是用这套 Skill 写的（dogfooding），所以不是纸上谈兵。Claude Code 用户装了就能直接用，`npx skills@latest add ByronFinn/dev-skills` 就行。

## 一、思考 / 推理增强类

**Grill Me（Skill）**，地址：https://github.com/mattpocock/skills

对用户方案做压力测试，连续追问加挑战假设，把设计里的漏洞和模糊地带挖出来。论坛里经常提到的那个 GrillMe，确实值得装。

**Sequential Thinking（MCP）**

把复杂问题拆成可执行的分步推理，中间可以修正或者回溯。用过一段时间还可以，不过现在不少 Agent 已经内置了分步思考能力，比如 Claude Code 的 Plan Mode（{{< ref "posts/2026-06-29-claude-code-plan-mode" >}}），所以它的不可替代性在降低。

## 二、开发 / 编程辅助类

**Context7（MCP）**，地址：https://mcp.context7.com/mcp

给模型提供最新的框架和库文档上下文，解决知识过时的问题。我在 opencode 里面用过一段时间，提升感觉没那么明显，可能要看使用场景。如果你的 Agent 要频繁处理刚发布的 SDK 或框架，它能用上；如果日常对话主要涉及成熟技术栈，它的价值不大。

**Supabase MCP**，地址：https://mcp.supabase.com/mcp

提供数据库 schema 查询、SQL 分析、权限策略检查。Supabase 本身有免费的在线数据库，所以它也适合用来存个人的结构化数据。

**Exa Search MCP**，MCP：https://mcp.exa.ai/mcp

安装：`npx -y @filiksyos/mcptoskill https://mcp.exa.ai/mcp --name=exa`

高质量语义搜索。用过一段时间还不错，比 AI 自己瞎拼 CURL 好用。不过有调用并发限制，去 exa.ai 建自己的凭证可以提一点额度，个人自用够用了。

## 三、浏览器 / 自动化类

**Playwright MCP**，地址：https://github.com/microsoft/playwright

浏览器自动化，可以做页面操作、UI 测试、数据抓取。AI 需要浏览器能力的时候，它就是默认选择。关于 MCP 协议本身怎么工作的，可以看 {{< ref "posts/2026-06-27-claude-code-mcp-protocol" >}}。

**Kimi WebBridge（Skill）**，入口：https://kimi.webridge.com

专为 AI Agent 设计的浏览器插件，让 AI 帮你开网页、点按钮、填表单、提取信息。我在 codex 里面用着挺好，可以直接操作登录过的网站。codex 自带的浏览器在需要认证的网站直接报错，这个不会。

## 四、工程平台 / DevOps 类

**GitHub MCP**，地址：https://github.com，入口：https://mcp.directory/

访问 GitHub 资源，包括 issue、PR、仓库分析等。使用率很高，但部分功能可以用 GitHub CLI 替代，按需装就行。如果你已经在用 gh CLI 做日常操作，装这个 MCP 的边际收益不大，主要优势是 Agent 可以直接调接口而不用解析 CLI 输出。

**Notion MCP**，地址：https://www.notion.so/

知识库管理、文档组织和项目记录自动化。Notion 算是这个领域的代表工具了，少量个人数据放上面没问题。

## 五、知识系统 / 记忆类

**Obsidian（Skill / MCP 接入）**，地址：https://obsidian.md/

本地知识库系统，做长期知识存储和检索。个人知识管理这块它确实做得扎实，不过要花点功夫配置和搭建。配合 Skill 或 MCP 接入后，Agent 可以跨 session 复用之前沉淀的知识，不需要每次都从头说上下文。

