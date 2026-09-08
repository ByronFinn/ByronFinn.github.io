# System Prompt Engineering: Decisions Behind 800 Lines


<!-- more -->


If you think a system prompt is just "giving the AI a persona", Claude Code's system prompt will upend that notion.

It isn't a few sentences. It's a **thousand-line template engine** made of multiple layers, each responsible for something different: identity definition, behavioral constraints, tool documentation, project context, memory injection, skill loading. Some layers are static (identical every time); others are dynamic (injected in real time based on the project, the session, user preferences).

The "You are a helpful assistant" you write in ChatGPT is the Hello World of system prompts. Claude Code's system prompt is a production application.

## Why Is the System Prompt So Long?

First, an intuitive question: aren't shorter prompts better? Less context consumed, less money spent, less interference.

For ordinary chat, yes. But Claude Code isn't ordinary chat — it's an **autonomous agent performing dangerous operations in unfamiliar environments**. The questions a system prompt must answer go far beyond "who are you":

- What is your primary goal? (help the user write code, not chat)
- Which tools can you use? (the tool definition list)
- Which operations need confirmation? (permission boundaries)
- What are this project's conventions? (CLAUDE.md injection)
- What has the user told you before? (memory injection)
- What professional skills do you have? (Skill injection)
- What do you do when something goes wrong? (error-handling strategy)
- What do you do when uncertain? (ask rather than guess)

Each question needs an explicit instruction. Stack those instructions together and you get a long prompt.

The point isn't length, it's **structure**. Eight hundred lines of unstructured text are noise; eight hundred lines of structured instructions are an operating-system kernel.

## Layered Architecture: From Static to Dynamic

Claude Code's system prompt breaks into four layers, from innermost (most stable) to outermost (most volatile):

**Layer 1: Core Identity**

This is the innermost layer, almost never changing. It defines the agent's basic identity and code of conduct: "You are an AI coding assistant named Claude. Your goal is to help the user accomplish programming tasks."

This layer also holds general behavioral constraints:
- Reply in the user's language
- Ask when uncertain; don't guess
- Explain your reasoning
- Understand intent first, then act

**Layer 2: Tool Definitions**

We covered the tool system last time. Tool definitions (name, description, parameter schema) are injected into this layer. It's one of the largest chunks of the system prompt — 30-odd tools, each with a structured description.

This layer is semi-dynamic: core tools are always present; deferred tools load on demand.

**Layer 3: Project Context**

This layer is one of Claude Code's most distinctive designs. It scans the project directory, loads `.claude/CLAUDE.md` files (with a hierarchical inheritance mechanism like .editorconfig), and injects project-specific conventions into the prompt.

A CLAUDE.md might contain:
- The project's tech stack and architecture notes
- Code style conventions
- Testing strategy
- Deployment process
- Known issues and gotchas

This means the same Claude Code "behaves differently" in different projects — not because the model changed, but because the injected context changed. In a React project it knows to use JSX; in a Rust project it knows to use Cargo.

**Layer 4: Session State**

The outermost layer, the most volatile. It holds dynamic information about the current session:
- Previously loaded memories (Memory)
- Activated Skills
- Current permission mode
- Active subagents

This layer can change on every loop iteration.

The four layers stack like an onion. The core identity is the kernel; the further out, the closer to the concrete situation of the current task.

## Placeholders and the Template Engine

If you've read Claude Code's prompt.ts source, you'll notice the system prompt isn't a string but a **template**. It contains plenty of placeholders that get replaced with real content at runtime:

```
{git_context}
{claude_md_content}
{memory_content}
{skill_content}
{tool_definitions}
{subagent_definitions}
{deferred_tool_definitions}
```

Each placeholder maps to a data source. At runtime the prompt builder walks the placeholders, fetches content from the corresponding modules, and substitutes it. If a data source is empty (say, the project has no CLAUDE.md), the placeholder is silently removed, leaving no empty husk in the prompt.

This templated design brings two benefits:

**Testability.** Every layer can be tested in isolation — you can verify "was CLAUDE.md loaded correctly" without running the full agent loop.

**Composability.** Different projects, user preferences, and permission modes combine into different prompts. One codebase adapts to endless use cases.

## CLAUDE.md: The Project Constitution

CLAUDE.md is one of the most underrated designs in the Claude Code ecosystem.

The idea is simple: **every project should have a "constitution" that tells any AI agent entering the project how to work.**

It sounds like a README, but it's fundamentally different. A README is for humans — it introduces what the project is, how to install it, how to use it. A CLAUDE.md is for AI — it tells the AI the project's conventions, constraints, and preferences.

A typical CLAUDE.md might look like this:

```markdown
# Project Conventions

- Use TypeScript, never JavaScript
- Components use functions + Hooks, not Classes
- Tests use Vitest; every new file must have a corresponding test
- Error handling uses the Result pattern uniformly, not try-catch
- Git commit messages follow the Conventional Commits format
```

To a human developer this reads as "reminders"; to an AI agent it's a **hard constraint**. Injected into the system prompt, it carries the same weight as the model's code of conduct.

CLAUDE.md also has hierarchical inheritance — the root CLAUDE.md applies to all subdirectories, and subdirectories can override or append. Same logic as .gitignore or .editorconfig, but far more significant for AI agents: it's a **formal carrier of project knowledge**.

The deeper implication: **project conventions shouldn't live only in people's heads — they should be written down in a machine-readable format.** Not a new idea (config files have existed forever), but CLAUDE.md is the first "project constitution" designed specifically for AI agents.

## Behavioral Constraints: Keeping the AI From Going Rogue

A large chunk of the system prompt exists purely to constrain the model's behavior. These aren't "suggestions"; they're "rules". Including but not limited to:

- **Understand before acting.** Don't start editing code the moment a request arrives. Read the relevant files, understand the existing architecture, then act.
- **Minimal-change principle.** Change only what needs changing; don't refactor unrelated code.
- **Explain your decisions.** Every change comes with a reason for why it was made that way.
- **Roll back on failure.** If an operation causes an error, try to restore the pre-operation state.
- **Never fabricate file contents.** If you haven't read a file, don't pretend to know what's in it.

The very existence of these constraints tells you something: **the model's default behavior isn't ideal.** An unconstrained model trends toward "over-eagerness" — it wants to help so badly that it starts acting before understanding the situation, changing a pile of things it shouldn't.

Behavioral constraints in the system prompt are like ABS and ESP on a sports car. The engine is powerful, but without brakes and stability control, the faster you go, the sooner you die.

## Deferred Injection: Not Everything Needs to Be There Up Front

Like the tool system's progressive disclosure, the system prompt also uses **deferred injection**. Not all information is stuffed in on the first call; it's injected gradually as the conversation progresses.

Take Skill content — a user has 10 Skills (writing standards, architecture design methods, testing strategies...), but the current task only needs "writing standards". The other 9 Skills' content stays out until the model explicitly needs them.

Or memory — a user may have dozens of stored memories, but only 3 are relevant to the current task. The system prompt injects just those 3, not all of them.

The core principle of deferred injection: **the more relevant the information, the earlier it's injected; the less relevant, the later (or never).** At bottom this is an information-retrieval problem — finding the most relevant subset from a mass of available information.

## What a System Prompt Really Is

At this point we can answer a fundamental question: what exactly is a system prompt?

It isn't a "persona". It isn't a "hint". It's a **runtime configuration** — like a program's config file, it defines the agent's behavioral boundaries, available resources, and operating rules in the current environment.

The only difference: this config file's format is natural language, and the parser is a large language model.

That's also why system prompt engineering increasingly resembles software engineering — you need modularity, templating, testability, maintainability. You aren't just "writing a paragraph"; you're "building a framework".

## Further Reading: BYF's PromptPlan and Ephemeral Injection

[BYF](https://github.com/ByronFinn/byf) takes system prompt structuring further than Claude Code. It has a dedicated `PromptPlan` module that splits the system prompt into **ordered named blocks** (`PromptBlock[]`), each tagged with a `CacheScope` — `global` (stable across sessions), `project` (stable within a project), `session` (changes every session), `none` (not cached). This four-block architecture ensures:

1. The **global block (Block 0)** contains only pure agent rules — identity, principles, safety — with zero per-session variables, making OpenAI's `prompt_cache_key` genuinely stable across sessions.
2. The **environment block stands alone**, so variables like `BYF_OS`, `BYF_SHELL`, and `BYF_WORK_DIR` don't pollute the global cache.
3. **Tools are sorted by stability**, built-in tools first and MCP tools after, so cache boundaries don't collapse when external services connect or disconnect.

BYF also introduces **ephemeral injection** — a finer-grained context management strategy. Dynamic content that changes at every step, like timestamps and permission-mode state, is no longer written persistently into the conversation history (`_history`); instead it's re-rendered per request via `getEphemeral()` and appended at the `before_user` position at the end of the history. The effect: **dynamic content has zero impact on the cache prefix** — the entire system prompt + conversation history stays cacheable, with only a few dozen "fresh" tokens at the tail changing each round.

The design aligns with Claude Code's layered injection, but BYF's "four-block architecture + ephemeral injection" pushes cache optimization further — from "make the prompt long but structured" to "manage precisely which parts of the prompt can be cached".

## Next Up

The system prompt defines the agent's rules of behavior, but rules need an enforcement mechanism. The previous post covered the tool system, this one covered behavioral constraints, and the next examines where the two meet: **the permission and security system** — when an agent may act directly, when it must ask the user, when it should be blocked. The design logic behind the 5-level permission model is, at heart, a trust-calibration problem.

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

