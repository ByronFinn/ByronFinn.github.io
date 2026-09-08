# TencentDB Agent Memory: Real Layered Memory for AI Agents


<!-- more -->

## Why AI Agents Need a Memory System

If you've spent serious time with AI agents, these scenarios will feel familiar:

- Re-explaining the project background, coding conventions, and output format preferences in every new session
- Halfway through a long task, the context fills up with tool logs and the agent starts "forgetting" earlier instructions
- Wanting the agent to learn your working habits, but having no way to do it except hand-writing a system prompt every time

**Memory isn't about making the AI store everything — it's about making sure humans never have to repeat themselves.** That's the core idea behind [TencentDB Agent Memory](https://github.com/Tencent/TencentDB-Agent-Memory).

Open-sourced by Tencent under MIT, the project has already gathered 2,400+ GitHub stars and provides a complete, fully local agent memory solution — **zero external API dependencies**, works out of the box.

## Core Highlights at a Glance

The project splits memory capability into two engines:

| Capability | Problem it solves | Technique |
|:-----|:----------|:---------|
| **Symbolic short-term memory** | Tool logs flooding the context during long tasks | Mermaid symbolic graph + context offloading |
| **Layered long-term memory** | Cross-session experience never accumulates | L0→L3 semantic pyramid |

{{< image src="/pictures/note/tencentdb-agent-memory-featured.svg" caption="TencentDB Agent Memory architecture overview" width="100%" >}}

The benchmark numbers are persuasive:

| Benchmark | Success rate gain | Token savings |
|:----------|:----------|:-----------|
| WideSearch | +51.52% (relative) | -61.38% |
| SWE-bench | +9.93% | -33.09% |
| PersonaMem | Accuracy 48%→76% | — |

Note how SWE-bench was run: 50 consecutive tasks per session, simulating the context accumulation pressure a real long-horizon agent faces — far stricter than evaluations that wipe the context after each task.

## Core Technique 1: Memory Layering — the L0-to-L3 Semantic Pyramid

Traditional memory systems chunk data into flat vectors; at recall time it's like blind-searching through a pile of sticky notes with no high-level guidance. TencentDB Agent Memory uses **layering** as its unified design paradigm:

```
┌─────────────────┐
│   L3 Persona     │  ← User profile: daily preferences, expression style, long-term goals
├─────────────────┤
│   L2 Scenario    │  ← Scenario blocks: related facts aggregated by context
├─────────────────┤
│   L1 Atom        │  ← Atomic facts: the smallest structured knowledge units
├─────────────────┤
│   L0 Conversation│  ← Raw conversations: complete history
└─────────────────┘
```

This layered design isn't only for long-term personalization — it runs through short-term task management and future skill generation:

- **Short-term context layering**: the bottom layer keeps raw tool output (`refs/*.md`), the middle layer extracts step summaries (`jsonl`), and the top layer condenses everything into a Mermaid task canvas
- **Long-term personalization layering**: progressively distilled from L0 raw conversations up to the L3 user profile; high layers capture preferences day to day, and you drill down to Atoms when details are needed
- **Skill generation layering** (roadmap): induce solution patterns from execution traces and eventually distill them into reusable Skills

**The key design principle: every piece of information is 100% traceable.** Whether it's an offloaded error log from short-term memory or a summarized user preference from long-term memory, you can trace it back completely along the `Persona → Scenario → Atom → Conversation` chain.

Low layers (facts, logs, traces) go into a database for reliable retrieval; high layers (profiles, scenarios, canvases) are stored as Markdown files so they stay readable and editable. **Low layers preserve evidence; high layers preserve structure.**

## Core Technique 2: Symbolic Memory — Expressing Task State in Mermaid

In long tasks, the biggest token consumers are usually messy process logs — search results, code snippets, error stacks. The project's **symbolic memory** approach is straightforward:

1. **Offload full logs to external files**: raw tool output is saved to `refs/*.md`
2. **Extract relations and generate a Mermaid symbolic graph**: task state transitions are depicted in dense Mermaid syntax
3. **Inject lightweight context into the agent**: the agent sees only a symbolic graph of a few hundred tokens
4. **Trace back on demand**: when details are needed, the full original text is retrieved instantly via `node_id`

```
Messy logs (hundreds of thousands of tokens) → offload raw text → external file system
                                              → extract relations → Mermaid symbolic graph (with node_id)
                                                                  → lightweight injection → agent context (a few hundred tokens)
                                                                                       ← drill down by node_id to restore the original
```

The elegance of this design: **express maximum semantics with minimum symbols**. Mermaid carries enough topological information for the LLM to understand task structure, while staying compact enough not to waste tokens.

## Engineering Maturity: Not a Demo, a Pluggable Component

The project offers two integration paths:

### Option 1: OpenClaw Plugin (one-line install)

```bash
openclaw plugins install @tencentdb-agent-memory/memory-tencentdb
openclaw gateway restart
```

After installation it automatically captures conversations, extracts memories, and injects recalls — it runs with zero configuration.

### Option 2: Hermes Gateway (one-command Docker launch)

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

Other engineering features:

- **Local backend**: SQLite + sqlite-vec, no extra services required
- **Hybrid retrieval**: BM25 + vectors fused with RRF, supporting both keyword and semantic recall
- **Agent tools**: ships two built-in tools, `tdai_memory_search` and `tdai_conversation_search`

## Hands-On: Integrating It with Pi Coding Agent

As a daily user of Pi Coding Agent (a CLI-based AI coding assistant that calls LLMs through OpenAI-compatible APIs), I tried wiring it up to TencentDB Agent Memory. What follows is an honest record based on actual operation.

### Integration Path: the Gateway HTTP API

TencentDB Agent Memory currently supports two host environments officially: the **OpenClaw plugin** and **Hermes Gateway**. Pi Coding Agent isn't one of them. However, the project's Gateway mode exposes a standalone HTTP API, which is a viable path for third-party agents.

Once the gateway is running, it exposes these endpoints:

| Endpoint | Method | Purpose |
|:-----|:-----|:-----|
| `/health` | GET | Health check |
| `/recall` | POST | Memory recall (prefetch before injecting context) |
| `/capture` | POST | Conversation capture (synchronous write to L0) |
| `/search/memories` | POST | L1 memory semantic search |
| `/search/conversations` | POST | L0 raw conversation search |
| `/session/end` | POST | Session end + triggers a pipeline flush |
| `/seed` | POST | Bulk import of historical conversations |

Architecturally, `StandaloneHostAdapter`'s `RuntimeContext` accepts any string for its `platform` field (the definition is `"openclaw" | "hermes" | "cli" | "gateway" | string`), meaning third-party frameworks can connect under a custom platform identity.

Pi Agent stores conversations as JSONL files under `~/.pi/agent/sessions/`. In theory you could bulk-import historical sessions via `/seed`, then call `/capture` to write each new message and `/recall` to fetch relevant memories into the context.

### What I Actually Ran Into

**The good:**

- **Cleanly decoupled gateway design.** Core logic is separated from host frameworks via the `HostAdapter` interface, and `StandaloneLLMRunner` uses the Vercel AI SDK + OpenAI-compatible APIs. Pi's model provider (via custom baseUrl and apiKey) can plug in directly, no modifications needed.
- **Clear HTTP API semantics.** Each endpoint has one job — capture writes, recall reads, search queries. The learning curve is gentle.
- **A ready-made path for importing history.** The `/seed` endpoint accepts bulk session data; Pi's JSONL session records can be converted to seed format with a script, so you don't start from zero.
- **Zero-dependency local operation.** SQLite + sqlite-vec are fully local; there's no separate vector database to deploy, which is friendly to a personal developer's machine.

**The not-so-good:**

- **No ready-made Pi adapter.** Only two adapter implementations exist today — OpenClaw and Hermes (Standalone) — so Pi Agent needs custom glue code to talk to the Gateway HTTP API. That means intercepting every turn of Pi's conversation, calling capture and recall, and injecting recalled results into the prompt; Pi currently offers no OpenClaw-style hook/plugin mechanism to automate this step.
- **Session management needs manual mapping.** Pi sessions are named by working directory + timestamp (e.g. `~/.pi/agent/sessions/--home-ssy-Projects-blog-src--/2026-05-17T...jsonl`), while TencentDB Agent Memory uses `session_key` + `session_id`. The glue layer needs a one-to-one mapping to ensure memory recall lands on the right session.
- **Model compatibility needs verification.** The gateway's LLM Runner is used by default for memory extraction (the L1/L2/L3 pipeline), which places real demands on a model's instruction-following ability. How the models Pi currently uses (such as GLM-5.1) perform on memory-extraction tasks needs actual testing; the project docs only verify DeepSeek-V3.2 and the GPT series.
- **Short-term memory compression adds limited value for a coding agent.** Symbolic short-term memory (the Mermaid canvas + context offloading) mainly tackles explosive tool-log growth in long-horizon tasks. The tool output Pi Agent produces when editing code usually fits within the context window (GLM-5.1 has a 200K-token window), so scenarios that truly need offloading are relatively rare.

### One-Line Summary

TencentDB Agent Memory's architecture leaves a clear channel for third-party agents (the Gateway HTTP API plus an extensible HostAdapter interface), but today you still have to write the glue code yourself. For a CLI tool like Pi Coding Agent, long-term memory (keeping user preferences and project context across sessions) is worth more than short-term memory compression. I'm looking forward to a cross-framework universal Adapter or SDK that lowers the barrier further.

## White-Box Debuggable: Memory Isn't a Black Box

This is what sets the project apart from many memory solutions. Every intermediate artifact is a readable file:

- L2 Scenario blocks are Markdown you can open and inspect directly
- L3 Persona lives in `persona.md`, traceable to the Scenario that produced it
- The short-term task canvas is Mermaid, readable by humans and agents alike
- Originals, summaries, and nodes are linked through `result_ref` and `node_id`

All layered memory artifacts live under `~/.openclaw/memory-tdai/`; when debugging, just walk the chain layer by layer instead of digging through an opaque database.

## Configuration: the Daily Knobs That Cover 90% of Use Cases

It runs with zero configuration, but the project offers a three-tier progressive configuration system. The parameters that matter most day to day:

| Parameter | Default | Notes |
|:-----|:------|:-----|
| `storeBackend` | `sqlite` | Storage backend |
| `recall.strategy` | `hybrid` | Recall strategy: keyword / embedding / hybrid (recommended) |
| `recall.maxResults` | `5` | Number of items returned per recall |
| `pipeline.everyNConversations` | `5` | Trigger L1 memory extraction every N conversations |
| `persona.triggerEveryN` | `50` | Update the user profile once every N new memories |

## Why I Recommend It

As someone who follows AI agent infrastructure closely, here's why I think this project deserves attention:

**1. The design philosophy is right.** It isn't just "store more" — it thinks about how to store, how to use, and how to debug. Layering and symbolization are structured thinking about memory systems, not brute-force accumulation.

**2. Fully local.** Zero external API dependencies means data never leaves your machine — very friendly to privacy-sensitive scenarios. The SQLite + sqlite-vec combo is enough for individual developers and small-to-mid teams.

**3. White-box design.** The explainability of a memory system directly determines how debuggable and trustworthy it is. Every intermediate artifact is human-readable, which matters enormously in production.

**4. High engineering maturity.** This isn't a proof of concept — it ships a complete plugin system, Docker support, hybrid retrieval, and layered configuration. The project structure is clean and the code quality holds up.

**5. An ambitious roadmap.** Cross-agent memory migration, automatic Skill generation, a visual debugging panel — these are the core problems of the agent memory field.

{{< admonition type=info title="Project Links" >}}
GitHub: [https://github.com/Tencent/TencentDB-Agent-Memory](https://github.com/Tencent/TencentDB-Agent-Memory)

License: MIT | Language: TypeScript | Stars: 2400+

If you find it useful, don't forget to give the project a Star.
{{< /admonition >}}

## Final Thoughts

The memory problem for AI agents is far from solved. Mainstream approaches either depend on external vector databases or crudely stuff historical summaries into the prompt — the former adds deployment complexity, the latter loses critical details.

TencentDB Agent Memory offers a third path worth taking seriously: through layered storage and symbolic representation, it strikes a genuinely good balance between token efficiency, information completeness, and debuggability.

If you're building long-horizon agent applications, this project is worth your time to study and try.

