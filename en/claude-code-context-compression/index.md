# Context Compaction: Four Ways to Give AI 'Infinite Memory'


<!-- more -->


The Think-Act-Observe loop has a natural enemy: **the context window is finite.**

Every loop iteration burns tokens — the model's thinking, the tool-call requests, the tool results. Reading one large file can cost thousands of tokens; a single test run's output can cost tens of thousands. A dozen rounds in, the context window is stuffed full.

What happens when the window fills? The model says "sorry, this conversation exceeds my context limit". For casual chat, who cares — open a new window. For a coding assistant, it means **amnesia** — it forgets the project structure, the changes already made, the user's preferences.

Claude Code's answer is a four-layer context compaction pipeline. The goal isn't to "cram in more" but to **keep what matters most and drop what doesn't**.

## Layer 1: Message Trimming

The crudest layer, and the most effective. When conversation history approaches the window limit, trim the **oldest messages**.

Sounds simple, but one detail matters: not all early messages are equally trimmable. The system prompt is always kept, because it defines the agent's rules of behavior. The user's first message (the initial request) is kept with priority, because it defines the task goal. What gets trimmed is the "process chatter" in the middle — tool calls and results already executed.

The assumption underneath: **the details of completed tool calls matter more than the description of a not-yet-finished task.** You've already read the files, changed the code, run the tests — the "results" of those operations live in the current project state; there's no need to keep full records in the conversation history.

The cost of trimming is that the model "forgets details". It remembers "I edited src/main.ts" but not exactly what changed. If it later needs to review that edit, it may have to re-read the file. Acceptable — the file is still there; the copy in the conversation history is redundant.

## Layer 2: Conversation Compaction

Trimming deletes; compaction **summarizes**.

The core idea: when conversation history grows too long, have the model produce a **summary** of the first half of its own conversation, then replace the original with the summary.

The rough flow:
1. Detect that conversation history exceeds a threshold (say, 70% of window capacity)
2. Split the history into a "stabilized first half" and an "active second half"
3. Have the model generate a structured summary of the first half: what was done, what was found, what was decided, what remains
4. Replace the first half's original messages with the summary
5. Keep the second half untouched

In Claude Code this corresponds to the `/compact` command — the user can trigger it manually, or the system runs it automatically when necessary.

The cost of compaction is **information loss**. A summary can't preserve every detail; subtle context can vanish in the abstraction. But unlike trimming, compaction preserves **semantics**, not just an "operation log". After trimming, the model forgets what was done; after compaction, it remembers what was done and why.

At bottom this trades **time for space** — spending the model's reasoning capacity (generating the summary) to buy context space (the summary is far shorter than the original conversation).

## Layer 3: Context Window Management

This layer doesn't compress; it **plans**. Before every model call it estimates token usage to make sure the window limit isn't exceeded.

Concretely:
1. Count the current conversation history's tokens
2. Add the system prompt's tokens
3. Reserve token space for the model's output (usually 4K-8K)
4. If the total exceeds the window limit, trigger trimming or compaction
5. Ensure the final request sent to the model stays within safe bounds

This mirrors OS memory management — check whether there's room before allocating, and reclaim if not. The difference: OS memory is uniform (every byte alike), while context tokens are not (some carry far more information than others).

Window management has one more trick: **dynamic reservation**. Different tasks need different output space. Generating code? Reserve more. Answering a question? Reserve less. Claude Code adjusts the reservation dynamically based on the current loop phase (tool call vs. text reply).

## Layer 4: Smart Injection

The most refined layer. It doesn't compress existing content; it **controls how much new content gets injected**.

We've covered the system prompt's layered architecture — core identity, tool definitions, project context, session state. Every layer costs tokens. Smart injection's strategy:

- **Core identity**: always fully injected (a few hundred tokens — worth it)
- **Tool definitions**: inject only tools likely needed now (progressive disclosure)
- **Project context**: inject only the CLAUDE.md fragments relevant to the current task
- **Memory**: inject only the most relevant entries (semantic matching)
- **Skills**: inject only activated Skills

Every layer makes the same trade-off: **between "information completeness" and "token savings".** The trade-off isn't fixed; it depends on the task at hand. Writing code needs full tool definitions; answering a question may need only the core identity.

## The Effect of Four Layers Stacked

Stack the four layers and here's the effect: a model with a nominal 200K context window can handle conversations equivalent to 500K or even 1000K tokens — through constant trimming, compacting, and re-injection.

The cost is **progressive information loss**. As the conversation stretches, the model knows less and less. It degrades from "knowing every line of every file" to "knowing the project's rough shape and the current task". Given enough complexity and enough length, it eventually decays to nearly "meeting for the first time".

At that point, the most effective move isn't compaction but **starting a new session**. Not because of technical limits, but because information loss has accumulated to the point where it degrades decision quality.

## The Essence of Context Compaction

At its core, context compaction isn't a technical problem; it's a **cognitive science problem**.

Human memory does the same thing. You don't remember every detail of yesterday's breakfast, but you remember "ate breakfast yesterday". You don't remember a transcript of every meeting, but you remember "last week's meeting decided to refactor to TypeScript". Through summarization, forgetting, and extraction, the brain maintains an effective model of the world on limited neural resources.

Claude Code's compaction pipeline is a rough simulation of human memory:
- Message trimming ≈ forgetting
- Conversation compaction ≈ summary memory
- Window management ≈ attention allocation
- Smart injection ≈ selective recall

Imprecise, but directionally right.

## An Unsolved Problem

Context compaction has a problem Claude Code hasn't fully solved: **the subjectivity of timing.**

When should you trim? When should you compact? When should you start a new session? The current implementation relies on hard-coded thresholds (say, "compact above 70%"), but these thresholds aren't universal. One 200K-window model and another 200K-window model can have completely different information densities — it depends on project size, task complexity, and the volume of data tools return.

The ideal is probably **adaptive thresholds** — compaction strategy tuned dynamically to the conversation's information density. Dense conversations (heavy tool calls, big file contents) trigger compaction earlier; sparse ones (mostly text exchange) later.

But that requires evaluating "information density" in real time — itself an open research problem.

## Further Reading: BYF's Observation Masking and CacheStakingStrategy

[BYF](https://github.com/ByronFinn/byf) goes finer than Claude Code on context compaction, elevating "context minimization" to a first-class engineering concern.

**1. Importance-based observation masking.** Rather than waiting until the context is nearly full, BYF sets a **threshold band** (60-85% token pressure) and triggers masks of different granularity at different pressure levels. At low pressure (60%), `Glob`/`Grep` results are masked first (low durable value); as pressure climbs to 80%, `Bash` output gets masked; `Write`/`Edit` results are kept longest. The replacement format is a compact structured summary — `[Bash: 'npm test', exit=0, 127 lines, stderr: none]` — preserving metadata plus head and tail fragments, so the model can decide whether to re-read the full output.

**2. Output offloading.** Full tool outputs beyond ~8000 tokens are written to temporary files; the tool result keeps only a 1000-character preview plus a file reference. BYF caps temp files by size and count (50MB per session, at most 100 files, FIFO eviction) to prevent unbounded growth.

**3. Turn-boundary cache staking (CacheStakingStrategy).** ADR 0011 defines a "3+1" cache-stake model — beyond the cache boundaries of the system prompt and the tool array, it adds a cache stake on "the last assistant message of the previous turn", freezing the entire preceding conversation into cache. In a typical CLI session this cuts input token cost by 50-80%. More elegantly, BYF abstracts the strategy into a provider-agnostic logical label (`CacheHint`): the Anthropic adapter translates it into explicit `cache_control` breakpoints, and the OpenAI adapter auto-matches prefix caching. **One strategy, different translations** — "separate policy from implementation" applied to caching.

## Next Up

Context compaction solves "short-term memory" — managing information within the current session. But a coding assistant also needs **long-term memory** — remembering user preferences, project conventions, and past feedback across sessions. Next up: Claude Code's **memory system** — four memory types, semantic recall, persistent storage — how AI "remembers you".

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

