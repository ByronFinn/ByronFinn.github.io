# AI Agent Skills and MCP: Which Ones Are Worth Installing


Conclusion first: plenty of tools out there can be installed, but most of them sit there gathering dust after installation. Below is what I filtered out of the things I actually use, sorted into five scenario categories, with a few genuinely used picks in each.

<!-- more -->

## First, One All-Rounder Recommendation

If you want a single install that covers most scenarios, take a look at this one:

**dev-skills**, at: https://github.com/ByronFinn/dev-skills

A skill set covering the full engineering workflow, from idea to release. Unlike single-purpose tools that solve one point, it strings the pipeline together: `/think` to think the design through → `/grill` to stress-test it → `/story` to slice it into executable issues → `/implement` to push forward seam by seam → `/review` for parallel review. Each skill runs independently, but they work better combined. I wrote an earlier piece, {{< ref "posts/2026-06-22-claude-code-skills-system" >}}, that took apart the loading and execution mechanics of skills — this is the same line of thinking.

Its own documentation is written with this very skill set (dogfooding), so it isn't armchair theory. Claude Code users can install and use it directly: `npx skills@latest add ByronFinn/dev-skills`.

## 1. Thinking / Reasoning Enhancement

**Grill Me (Skill)**, at: https://github.com/mattpocock/skills

Stress-tests your design: relentless follow-up questions and challenged assumptions that dig out the holes and fuzzy areas. This is the GrillMe you see mentioned constantly on forums, and it genuinely deserves a slot.

**Sequential Thinking (MCP)**

Breaks complex problems into executable step-by-step reasoning, with room to revise or backtrack mid-way. I used it for a while and it's decent, but many agents now have built-in step-by-step thinking — Claude Code's Plan Mode, for example ({{< ref "posts/2026-06-29-claude-code-plan-mode" >}}) — so its irreplaceability is fading.

## 2. Development / Coding Assistance

**Context7 (MCP)**, at: https://mcp.context7.com/mcp

Feeds the model up-to-date framework and library documentation, solving the stale-knowledge problem. I used it in opencode for a while; the improvement didn't feel dramatic and probably depends on your use case. If your agent frequently handles freshly released SDKs or frameworks, it will earn its keep; if your daily work mostly involves mature stacks, it adds little.

**Supabase MCP**, at: https://mcp.supabase.com/mcp

Provides database schema queries, SQL analysis, and permission policy checks. Supabase itself offers a free online database, so it also works well for storing personal structured data.

**Exa Search MCP**, MCP: https://mcp.exa.ai/mcp

Install: `npx -y @filiksyos/mcptoskill https://mcp.exa.ai/mcp --name=exa`

High-quality semantic search. I used it for a while and it's solid — better than the AI freestyling cURL calls on its own. There is a concurrency limit on calls; creating your own credentials at exa.ai bumps the quota a bit, which is enough for personal use.

## 3. Browser / Automation

**Playwright MCP**, at: https://github.com/microsoft/playwright

Browser automation for page operations, UI testing, and data scraping. When an AI needs browser capability, this is the default choice. For how the MCP protocol itself works, see {{< ref "posts/2026-06-27-claude-code-mcp-protocol" >}}.

**Kimi WebBridge (Skill)**, entry point: https://kimi.webridge.com

A browser extension designed for AI agents, letting the AI open pages, click buttons, fill forms, and extract information for you. It works well for me in codex — it can directly operate sites I'm logged into. Codex's built-in browser just errors out on sites requiring authentication; this one doesn't.

## 4. Engineering Platform / DevOps

**GitHub MCP**, at: https://github.com, entry point: https://mcp.directory/

Access to GitHub resources, including issues, PRs, repository analysis, and more. High usage rate, though some of it can be replaced by the GitHub CLI, so install as needed. If you already run daily operations through the gh CLI, the marginal gain from this MCP is small — its main advantage is that the agent can call the API directly instead of parsing CLI output.

**Notion MCP**, at: https://www.notion.so/

Knowledge base management, document organization, and project record automation. Notion is pretty much the flagship tool in this space; keeping a modest amount of personal data there is fine.

## 5. Knowledge Systems / Memory

**Obsidian (Skill / MCP integration)**, at: https://obsidian.md/

A local knowledge base system for long-term knowledge storage and retrieval. For personal knowledge management it is genuinely solid, though it takes some effort to configure and set up. Once hooked up via a skill or MCP, an agent can reuse previously accumulated knowledge across sessions instead of re-explaining the context from scratch every time.

