# AI Memory Systems: Four Memory Types and Semantic Recall


<!-- more -->


Last time we covered context compaction — solving "how much the current session can remember". But a coding assistant needs another kind of memory: **long-term memory across sessions.**

You close Claude Code and reopen it tomorrow. What should it know?
- You prefer TypeScript over JavaScript
- You said last time "don't use the underscore library"
- This project uses Vitest, not Jest
- You once corrected one of its misunderstandings

Context compaction can't handle these. The session ends, the history clears, tomorrow is a fresh window. If the AI needs you to re-explain everything each time, it isn't an assistant — it's a burden.

The question Claude Code's memory system answers: **what should AI remember, where is it stored, how is it found, and when is it used.**

## Four Memory Types

Claude Code sorts memory into four types, each answering a different "what to remember":

**User Memory** — personal preferences and habits. "I like a concise code style", "I'm on macOS", "my email is xxx". These memories follow the user, not the project. Switch computers, switch projects — they still apply.

**Feedback Memory** — records of user corrections and praise. "Last time you got it wrong — I meant B, not A", "the tests you wrote last time were great, keep that style". These memories are the agent's fuel for self-improvement — they let the AI learn from past interactions.

**Project Memory** — the current project's conventions and state. "This project uses the Next.js App Router", "error handling always goes through toApiError()", "deployment is on Vercel". These memories follow the project, not the user. Same person, new project — the memories change.

**Reference Memory** — information the user explicitly marks as an "important reference". "Remember this doc link, I'll need it often", "this API's auth is unusual, note it down". These memories are user-created "bookmarks".

The essence of the four-way split is **memory scope**: user memory is global (shared across all projects), project memory is local (one project), feedback memory is cross-cutting (user + project combined), reference memory is manual (explicitly user-controlled).

## How Memories Are Stored

Claude Code's memories don't live in a database; they live on the **filesystem** — each memory entry is a Markdown file with YAML frontmatter.

A memory file might look like this:

```markdown
---
type: user
tags: [programming, preference]
created: 2026-06-15
lastAccessed: 2026-07-01
---

The user prefers a functional programming style and avoids mutable state.
```

Storing memories on the filesystem looks primitive, but it has real benefits:

- **Versionable.** Git tracks memory changes — you know when a memory was created, by whom, and how often it changed.
- **Auditable.** Users can open the files anytime to see what the AI remembers — and delete what they'd rather it didn't.
- **Portable.** Memory files clone along with the project — no extra database or cloud service needed.
- **Searchable.** `grep` covers memory search; no dedicated query interface needed.

This is a "files as database" design philosophy — same lineage as CLAUDE.md. No extra storage layer; solve everything with the filesystem you already have.

## Semantic Recall: Not Keyword Matching

Stored — but how do you find them? With keyword matching, the memory "I like concise code" wouldn't match when the user says "write me a function" — no keywords in common.

Claude Code uses **semantic recall** — an embedding model converts both memory entries and the current query into vectors, cosine similarity is computed, and the semantically most relevant memories surface.

The flow:
1. When the user makes a request, the system extracts the query's semantic vector
2. It computes each memory's similarity to the query
3. It takes the Top-K most relevant memories
4. It injects those memories into the "memory" layer of the system prompt

This means that when the user says "write some code", the system can still recall "the user prefers a concise code style" — semantically related even with zero keyword overlap.

Recall precision depends on embedding quality. A good embedding model captures subtle semantic differences; a poor one drags in irrelevant memories or misses relevant ones. Claude Code uses a sideQuery mechanism — an extra embedding-model call alongside the main task to find relevant memories.

## The Prefetch Mechanism

Semantic recall has a performance problem: every user request searches the memory store. With hundreds of entries, that's hundreds of similarity computations per request.

Claude Code's optimization is **prefetch** — at session start, preload and cache the subset of memories most relevant to the current project. Later requests hit the cache first, falling back to full semantic search only when the cache isn't enough.

The prefetch order: project memory first (memories about the current project are most likely needed), then user memory (user preferences are always relevant), and finally feedback and reference memories.

At bottom this is a **caching problem** — the same class as CPU L1/L2 caches or the browser's HTTP cache. Hot data loads ahead; cold data loads on demand.

## Freshness Warnings

Memories go stale. Six months ago you said "prefer Redux"; by now you may have migrated to Zustand. If the AI still cites that expired memory, it will judge wrongly.

Claude Code's memory system has a **freshness warning** mechanism — when an injected memory exceeds a certain age (say, 90 days), the system annotates it in the prompt: "this memory may be outdated". Seeing the flag, the model treats the memory cautiously or proactively confirms with the user.

This exposes a deeper truth: **the value of memory decays with time.** Not all memories age alike — a basic preference ("I use macOS") may hold for years, while project state ("uses Redux") can go stale in weeks.

The ideal would be different TTLs (Time To Live) per memory type, or a confidence-decay function instead of a hard threshold. The current implementation uses a simple age threshold — imperfect, but it tells the model "this information may be unreliable".

## The Boundaries of the Memory System

Claude Code's memory system isn't omnipotent. It has clear boundaries:

**It doesn't remember code contents.** The memory system stores "meta-information" (preferences, conventions, feedback), not code itself. Code lives in files; read them when needed.

**It doesn't keep full conversation history.** History is short-term memory, managed by context compaction. The memory system is long-term memory, storing only summary-level conclusions.

**It isn't shared across users.** User memories are private; project memories belong to the project. Two different people using Claude Code on the same project have different user memories but share the project memory.

These boundaries aren't technical limits; they're **design choices**. A memory system that remembers everything becomes a chaotic log file. Bounded memory is useful memory.

## The Philosophy of the Memory System

One design philosophy sits behind Claude Code's memory system:

**AI memory shouldn't be a black box.** Users should know what the AI remembers, and be able to view, edit, and delete it. Memories live as plaintext files on the filesystem, not in some invisible cloud database.

It carries the same DNA as "user data" design in traditional software — your files on your disk, your settings in readable config files. AI memory is no exception.

It also gives the memory system a natural security model: **filesystem permissions are memory permissions.** Whoever can access the project directory can see the project memory; whoever can access the user directory can see the user memory. No extra access-control layer needed.

## Further Reading: BYF's Wire Records — Another Shape of Memory

[BYF](https://github.com/ByronFinn/byf) skips Claude Code's filesystem memory and chooses **event sourcing** as its core mechanism for cross-session persistence.

Every state-changing operation in BYF is recorded as JSONL to `wire.jsonl` — in BYF's own words, "Wire Records are the event-sourcing persistence layer". Every step of every turn (user input, model reply, tool call, tool result) is an independent record. To restore a session, replay the records to rebuild in-memory state. BYF's `AgentRecords` module is the "replay engine"; it supports protocol version migration so old sessions remain recoverable on new BYF versions.

The strength of this design is **debuggability**: BYF ships a `vis` tool (a visual debugger) that reads the wire records under `$BYF_HOME/sessions` and renders them as a browsable timeline/tree view. You can replay every tool call's request and response, every step's token consumption, every compaction trigger point — this isn't memory; it's an **audit trail**.

BYF also builds **session forking** on wire records — creating a new session from an existing one while the original stays untouched. The implementation is a full directory copy plus a `state.json` rewrite. Unlike Git branches, BYF forks session records, not working-tree files. Users can explore alternative paths without losing history — "what if I had taken a different approach here?"

BYF's choice reveals a fact: a memory system isn't only "what the AI remembers" — it's also "which human operations get recorded, replayed, explored". Memory serves the AI; records serve the human.

## Next Up

Memory lets the AI remember "who is using it" and "what project it's on". But memory alone isn't enough — the AI also needs **professional skills** for particular kinds of tasks. Next up: Claude Code's **Skill system** — reusable encapsulated expertise. Why is a Skill a "prompt module" rather than a plugin? And how do you decide between on-demand loading and full injection?

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

