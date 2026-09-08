# Permissions and Security: Destructive Power, Under Control


<!-- more -->


Giving an AI coding assistant file-write permission is like handing scissors to someone extremely smart who occasionally hallucinates.

Most of the time it knows what it's doing, but every so often it will confidently delete a file it shouldn't, or set a critical config to a value that looks plausible and is actually wrong. The model isn't malicious; it just **makes mistakes** — usually with great confidence.

Claude Code's permission system exists to solve exactly this: **find the balance between "asking every time is annoying" and "never asking is dangerous".**

## Three-Axis Classification: The Risk Matrix of Operations

Claude Code's permission system starts by classifying tool calls along three axes:

**Read** — `read_file`, `grep`, `glob`, `ls`. These operations change no state; the worst outcome is a few wasted tokens. Allowed by default.

**Edit** — `write_file`, `edit`, `bash` (commands with side effects). These operations change project files and can introduce errors, but they're usually reversible (Git). Handled in tiers.

**External** — `web_search`, `web_fetch`, `bash` (network requests). These operations reach systems beyond the project and can produce irreversible side effects (sending requests, calling APIs). Handled most cautiously.

The three axes aren't absolute. A `bash` command straddles all of them — `ls` is Read, `rm -rf` is Edit, `curl -X POST` is External. The permission system has to parse the command's contents to judge its risk level, which introduces its own uncertainty.

## The 5-Level Permission Model

Claude Code defines five permission levels, from loosest to strictest:

**default** — the middle ground. Read executes directly, Edit confirms depending on context, External confirms by default. This is most people's daily mode.

**plan** — read-only mode. All Write and External operations are blocked; the agent can only read and analyze. Fits the "let me first understand this project" scenario.

**acceptEdits** — trust edits. Read and Edit execute directly; only External needs confirmation. Fits the "go ahead and change the code, I trust you" scenario.

**bypassPermissions** — full trust. All operations run without confirmation. For highly trusted scenarios or automated pipelines. **Not recommended for daily use.**

**dontAsk** — zero trust. Every operation requires confirmation; equivalent to manually reviewing each step. For learning, debugging, or extremely sensitive projects.

These five levels aren't "security levels" — they're **trust-calibration knobs**. The user adjusts them manually based on the current task's sensitivity and how much they trust the agent.

## Trust Shouldn't Be Binary

Most tools have binary permission models: you either have permission or you don't. File systems have read/write/execute bits, APIs have OAuth scopes, Docker is root or not.

Claude Code's permission model is **continuous**. It accepts that trust isn't a switch but a slider — how much you trust the agent depends on context:

- Editing a test file vs. editing production deployment config → different trust
- The agent has worked on this project for 10 rounds vs. it just started round 1 → different trust
- You wrote this project vs. you just cloned it → different trust

The 5-level model is a rough approximation of this "contextual trust". It isn't fine-grained (ideally every operation would be evaluated dynamically), but it finds a **balance point humans can understand** between usability and safety.

## Design Details of the Confirmation Mechanism

When the agent initiates an operation that needs confirmation, the permission system pauses the loop and shows the user a confirmation request. This isn't a bare "confirm/cancel" — it carries structured information:

- **Which tool** is being called
- **Which parameters** are being passed
- **Why** the agent believes this operation is needed (based on the preceding conversation)

The user judges based on this information. Not "blind trust" — an **informed decision**.

One more detail in the confirmation mechanism: **managing confirmation fatigue**. If the agent fires off many operations needing confirmation in a short time (say, batch-editing 20 files), the user falls into "confirmation fatigue" — clicking "confirm" repeatedly without actually reading. Claude Code's countermeasure is letting users switch to a looser permission mode, or use `acceptEdits` to trust edit operations in bulk.

This exposes a deep tension: **a zero-sum game between security and convenience**. More secure means more friction; more convenient means more dangerous. The essence of a permission system is finding a comfortable anchor point on that spectrum.

## Switching Permission Modes

Permission modes aren't fixed. Users can switch at runtime via commands — `/permissions` adjusts the current session's permission level, `/plan` switches to read-only planning mode.

The design intent of dynamic switching is clear: **different task phases need different trust levels.**

A typical workflow:
1. `plan` mode at startup — let the agent analyze the project first, read-only
2. Switch to `default` after analysis — start changing code, confirm critical operations
3. Switch to `acceptEdits` for large refactors — trust the agent's editing, reduce confirmation fatigue
4. Switch back to `default` or `dontAsk` when external operations are involved — treat network requests with care

Permission-mode switching isn't a security feature; it's a **workflow feature**. It lets users adjust the granularity of collaboration with the agent across task phases.

## Security Is More Than the Permission System

The permission system is one ring of Claude Code's security architecture, not the whole of it. Other measures include:

**System prompt constraints.** Covered earlier — the system prompt carries explicit behavior rules: "minimal-change principle", "understand before acting", "never fabricate file contents". These are soft constraints, enforced by the model's comprehension rather than by force.

**Tool-level guardrails.** Some tools have built-in safety checks. The `bash` tool, for instance, refuses obviously dangerous command patterns (like `rm -rf /` without confirmation); `write_file` refuses paths outside the project directory.

**Git as the safety net.** Claude Code integrates deeply with Git — every file change is traceable and revertible in Git history. The permission system prevents errors; Git provides recovery after they happen.

**Session logs.** Every tool call and model output is recorded. When something goes wrong, you can trace the full chain of events.

Security isn't a single mechanism; it's **defense in depth**. The permission system is one layer, joining system prompt constraints, tool-level guardrails, Git rollback, and session logs in a multi-layer defense.

## Further Reading: BYF's Approval System and Lifecycle Hooks

[BYF](https://github.com/ByronFinn/byf)'s permission system builds on Claude Code's 5-level model and adds two designs worth noting:

**1. Approval as an independent subsystem.** BYF's `Approval` layer is more than "accept/reject" — it's a full permission-gating pipeline. Before a tool executes, the agent shows the user structured information (command, diff, file-operation details), and the user chooses to approve, reject, or cancel. The outcome flows back into the tool result via the `blockedReason` field — not a simple "did it run" but "why it didn't run" (rejected vs. canceled) — so the model can adjust its behavior based on the specific reason.

**2. Lifecycle hooks.** BYF lets users mount local commands at key points of a tool call — `pre-tool` (audit before execution) and `post-tool` (notify after execution). Users can implement their own security policies in shell scripts: "check whether a file write touches the production config directory" or "pop a desktop notification after every execution". BYF doesn't define security rules for you; it gives you a **hook mechanism** to define them yourself.

Both designs point the same way: **trust isn't a preset in the permission model — it's something the user constructs dynamically through interaction.** BYF's hooks system is especially interesting: it lets users embed their own security policies into the agent's execution flow without touching BYF's core code.

## The Philosophy of the Permission System

One design philosophy sits behind Claude Code's permission system:

**An AI agent should be neither fully trusted nor fully distrusted. It should be trusted within boundaries — acting autonomously inside clearly drawn lines, requesting confirmation at the line, and being blocked beyond it.**

This philosophy descends from the Principle of Least Privilege in traditional software, with one key difference: traditional least privilege is **static** (fixed grants at process start), while an AI agent's least privilege is **dynamic** (adjusted in real time by task phase, user preference, and operation type).

Dynamic least privilege is a younger, less mature design space. Claude Code's 5-level model is a starting point, not an endpoint. The future likely holds finer-grained automatic risk assessment — no manual knob-turning; the system computes "should this operation ask" from operation type, project sensitivity, and agent confidence.

Until then, five knobs is a reasonable engineering compromise. Imperfect, but it gives users control and agents room to act.

## Next Up

The four posts of Phase 1 covered the Think-Act-Observe loop, the tool system, the system prompt, and permission security — the core skeleton of an AI agent.

Phase 2 moves into deeper capabilities. Next up: **context compaction** — as conversations grow longer and tool calls multiply, the context window will eventually run out. Claude Code uses a four-layer pipeline to make the AI look like it has "infinite memory", but underneath it's a precise game of token management.

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

