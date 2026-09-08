# Multi-Agent Architecture: The Art of Fork-Join Collaboration


<!-- more -->


There's a counterintuitive phenomenon: take the same model, split it into multiple independent instances, and have them collaborate — the result is often better than a single instance.

Not more compute (three instances burn more total tokens than one), not more capability (every instance is the same model). The gain comes from **role separation** — when each agent attends to only one facet of the problem, it works with more focus and more depth than a "do-everything agent".

Claude Code's multi-agent architecture is built on exactly this observation.

## Why One Agent Isn't Enough

A single agent has a structural problem with complex tasks: **role conflict.**

Imagine asking Claude Code to "analyze this project, then propose a refactoring plan." The task has two phases:
1. **Explore** — read files, understand the architecture, find problems (needs broad but shallow scanning)
2. **Plan** — design the refactoring based on what exploration found (needs deep but focused thinking)

If one agent does both, the detailed information gathered during exploration occupies context, leaving possibly no room for deep reasoning at planning time. Worse, the "discovery mindset" of exploring and the "decision mindset" of planning are cognitively different — holding both in one context, the model easily gets confused.

How do humans handle this? Meetings. First a research group collects information; after a synthesis, a decision group designs the plan. Claude Code's multi-agent architecture does the same thing.

## Three Built-in Agent Roles

Claude Code ships three subagent roles, each with clear responsibility boundaries:

**Explore** — read-only, fast scanning. Its job is "learn as much about the project as possible": read files, search code, list directories, inspect dependencies. It writes no code, changes no configs, makes no decisions. It only gathers information and produces a report.

Explore's core design decision is **breadth-first**. Rather than analyzing any file deeply, it scans as many as possible quickly, building a "map" of the project. The output is a structured summary: project structure, tech stack, key files, potential issues.

**Plan** — deep analysis built on Explore's report. Also read-only, but with a different focus: Explore answers "what's in the project"; Plan answers "how to change it". Plan takes Explore's findings, combines them with user requirements, and produces a structured action plan.

Plan's core design decision is **depth-first**. It doesn't care about the project's full panorama — only the parts relevant to the current task. The output is an executable plan: steps, priorities, risk assessment, estimated effort.

**General** — full permissions, the executor. It takes Plan's proposal and implements it: read files, write code, run tests, fix bugs. It's the most capable of the three roles but also the most tightly bound — it shouldn't explore or plan; it should execute the agreed plan.

General's core design decision is **execution-first**. It makes no strategic decisions; it converts strategic decisions into concrete operations.

## The Fork-Join Pattern

The collaboration pattern of the three roles boils down to **fork-join**:

```
Main Agent
  │
  ├─► Explore (fork) ──┐
  │                    ├─► Plan (fork) ──┐
  │                    │                 ├─► General (execute)
  └────────────────────┴─────────────────┴─► results join back to Main Agent
```

The main agent receives the user request, decides which subagents are needed, and forks them in order. Each subagent runs in its own context — its own conversation history, its own tool calls, its own Think-Act-Observe loop. When a subagent finishes, its results join back to the main agent, which integrates them and replies to the user.

The key design is **context isolation**. Explore doesn't know what Plan is doing; Plan sees only Explore's report (not the raw data); General sees only Plan's proposal (not the exploration). Each subagent's context contains only what it needs.

The benefit of context isolation is **preventing contamination**. If all roles shared one context, Explore's mass of scan data would crowd out Plan's reasoning space. Isolated, each subagent gets its own clean window to focus on one thing.

## Subagent Startup and Shutdown

Subagents don't run forever. They're ephemeral instances — **created on demand, destroyed when the task is done**.

When the main agent decides to launch a subagent, it creates an independent Agent instance and injects a specific system prompt (defining the role), tool permissions (defining capability boundaries), and a task description (defining the goal). The subagent runs its own Think-Act-Observe loop until the task is done. Its output is packaged into a structured report returned to the main agent, and the instance is destroyed.

This means subagents carry no persistent state. They don't "remember" the last exploration, don't "learn" from earlier planning mistakes. Every run starts from zero.

Not a defect — a design choice. **Stateless subagents are easier to reason about** — you know their behavior depends only on inputs (system prompt + task description), never on hidden state.

## Custom Agents

Beyond the three built-in roles, Claude Code supports custom agents. Users create Markdown files under `.claude/agents/` defining an agent's role, capabilities, and code of conduct.

A custom agent file might look like this:

```markdown
# Security Audit Agent

## Role
An agent specializing in code security audits.

## Capabilities
- Read-only permissions
- Can read files and run security scanning tools

## Code of Conduct
- Focus on injection vulnerabilities, XSS, CSRF
- Assign CVSS scores when vulnerabilities are found
- Categorize by OWASP Top 10
```

The very existence of custom agents reveals a deeper design idea: **an agent's role should be defined declaratively, not hard-coded into the program.** Like Skills, an agent role is "configurable expertise" — except a Skill configures "how to do it" while an agent configures "who does it".

## The Cost of Multi-Agent

Multi-agent isn't free. It has explicit costs:

**Token consumption multiplies.** Every subagent has its own system prompt and its own conversation history. Three subagents cost roughly 2-3x a single agent's tokens (not 3x, since subagent conversations are usually shorter).

**Latency grows.** Subagents are called serially (Explore → Plan → General), each waiting on the previous. Total latency is the sum of all subagent latencies.

**Information loss.** Every handoff compresses. Explore's raw data is compressed into a report for Plan; Plan's detailed analysis is compressed into a proposal for General. What the final executor sees may be a "summary of a summary" of the original information.

Multi-agent pays off only when task complexity exceeds what a single agent can handle. Simple tasks ("fix this function for me") don't need forked subagents — just let General do it and be done.

## The Philosophy of Multi-Agent

One design philosophy sits behind Claude Code's multi-agent architecture:

**Complex tasks shouldn't be handled by one do-everything agent; they should be decomposed into clearly-roled subtasks completed by focused subagents working together.**

It matches the division-of-labor logic of human organizations exactly. You don't have one person do market research and product design and write the code — you have different people do different things, then integrate the results through coordination mechanisms (meetings, documents, processes).

The multi-agent architecture is **organization theory, agent edition**. It doesn't rely on the model getting smarter; it relies on the division of labor getting clearer.

## Further Reading: BYF's Foreground Subagents and the Live Viewer

[BYF](https://github.com/ByronFinn/byf) evolves Claude Code's multi-agent architecture in two directions.

**1. Foreground subagents and the live viewer.** BYF subagents run in two modes: background (managed via `/tasks`) and foreground (blocking the parent, with a full-screen live viewer opened via `/agent`). Foreground subagent events route through `routeSubagentEvent` to the parent's `ToolCallComponent`, so the user sees every step — lifecycle state changes, tool activity, approval waits, errors, and the final result. This isn't the model's private chain of thought; it's an **observable activity record**.

One lesson I've learned myself: a subagent's "observability" matters far more than its "speed". When a subagent is running but the screen is blank, the user can't tell whether it's stuck or working. BYF's live viewer solves exactly that — it makes the subagent's work process transparent.

**2. The TaskEntry discriminated union.** A BYF design-debt cleanup case. The background task manager used a single `ManagedProcess` structure to manage two kinds of tasks at once: real OS processes (with pid, stdin/stdout/stderr streams) and subagents (pure JS Promises). To make Promise tasks fit, the code carried one `as unknown as KaosProcess` cast — the only `as unknown` in the BYF source.

By introducing the `TaskEntry` discriminated union (`ProcessTaskEntry | PromiseTaskEntry`), BYF eliminated that escape hatch completely. The compiler now forces a `kind` guard to narrow the type before accessing `entry.proc`. This refactor doesn't "change functionality" — it "changes types" — yet it makes every later use of background tasks safer.

This is the same idea as Claude Code's "three subagent roles", approached from the opposite side: **Claude Code distinguishes agents' behavior by role; BYF distinguishes tasks' shapes by type.** Both aim at the same goal — a more robust, more predictable multi-agent system.

## Next Up

Multi-agent makes collaboration inside the agent more efficient. But agents also need to collaborate with external tools — databases, APIs, third-party services. Next up: the **MCP (Model Context Protocol)** — why is it called "the USB-C of AI tool interconnection"? What are the trade-offs of JSON-RPC over stdio? And why do AI tools need a standard protocol at all?

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

