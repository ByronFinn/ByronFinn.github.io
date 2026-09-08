# What Trellis Does, and Whether It Fixes AI Coding Standards


The most annoying thing about coding with AI isn't that it writes bugs — it's that it writes them differently every time. Same requirement, three conversations, three implementations. The standards live in your head; the AI doesn't know them.

<!-- more -->

Trellis tries to solve this. It's not yet another AI coding assistant — it's a framework for injecting project standards into AI: the AI reads your standards before writing code, gets checked automatically after writing, and once the check is done, anything newly learned gets distilled back into the standards. The more you use it, the better the AI knows your project.

This article covers Trellis's core mechanics, how it differs from similar tools, the actual workflow, and real cases.

## The Three Pain Points of AI Coding

Problems first. AI coding today has three flaws you can't get around:

**Vibe Coding**: every conversation, the AI is "the new guy." Ask it for a login module and the first time it's JWT, the second time sessions, the third time it might store passwords in plaintext. It's not that the AI can't do it right — nobody told it the standard, and you can't re-explain everything every single time.

**Context loss**: a new session opens and the AI has amnesia. Which files changed last time, what architecture was used, what pitfalls were hit — all wiped. You end up repeating "our project uses the Next.js App Router" and "all error handling goes through toApiError()" over and over.

**Fragmented standards**: project conventions are scattered across PR comments, Slack messages, and senior colleagues' heads. The AI has no way to learn these implicit agreements, and feeding them in by hand every time is untenable.

All three trace back to the same root: **the AI has no project memory and no standards to constrain it**. Code isn't the asset — the standards are. Yet for most teams, the standards exist only in human heads.

---

## What Is Trellis

In one sentence: Trellis is scaffolding for AI.

It injects project standards through automation, steering AI to write code along the path the standards define. Specifically:

- Supports 14+ AI coding platforms (Claude Code, Cursor, OpenCode, Codex, Gemini CLI, Windsurf, Kiro, Copilot, etc.)
- Cross-session persistence via the Workspace Journal, so AI remembers what it did last time
- Auto-trigger Skills + a Check Sub-agent verification loop that hardens workflows
- A Git-versioned spec library, shared and reused at team level
- Specs grow with the project — the more you use it, the better the AI knows you

{{< image src="/pictures/note/trellis-core-concepts.svg" alt="Trellis's four core concepts" caption="Trellis's four core concepts: Spec supplies the standards, Workspace keeps memory, Task drives execution, Skill automates the workflow" >}}

---

## How It Differs from OpenSpec and Superpowers

Trellis isn't alone in the market. OpenSpec (51.3k stars) and Superpowers (210.2k stars) do similar things. They're not bad — they just solve problems at a different layer.

**OpenSpec**'s idea is "reach consensus first, then write code." A four-stage workflow (Propose → Review → Apply → Archive), with specs stored in Git and readable across sessions. But it has no personal developer memory layer, no auto-trigger workflows, and no structured task system — it's driven by manual slash commands.

**Superpowers**' idea is "inject engineering skills into AI." SKILL.md files are shareable across projects, and the Brainstorm → Plan → TDD → Review flow is enforced. But it has no project-level spec management and no persistent Workspace journal — rigorous, but with heavier overhead.

**Trellis** tries to have it all: spec-driven (like OpenSpec) + engineering skills (like Superpowers) + cross-session memory (unique to it) + task lifecycle management + a parallel sub-agent architecture + team-level Git-versioned sharing.

| Dimension | OpenSpec | Superpowers | Trellis |
| --- | :---: | :---: | :---: |
| **Standards management** | Spec library | None | Layered specs + self-updating |
| **Engineering skills** | Manual commands | TDD / planning / review | Auto-trigger Skills |
| **Cross-session memory** | Spec docs persist | None | Spec + Workspace Journal |
| **Task management** | Four-stage flow | None | Full lifecycle + hooks |
| **Sub-agents** | None | Sub-agent development | Research / Implement / Check |
| **Team sharing** | Git + delta | Generic skill sharing | Project-specific specs + Registry |
| **Platform support** | 20+ tools | 6+ tools | 14+ deep integrations |

The best practice is Trellis (standards + workflow) paired with GitNexus (code-structure awareness), forming a complete AI engineering setup. GitNexus integration comes later in this article.

---

## The Four Core Concepts

Trellis runs on four things, consistent across platforms.

### 1. Spec (Standards)

The `.trellis/spec/` directory, where your coding standards live in Markdown. Files are split by module (frontend / backend / guides), and the AI reads the specs before writing code.

A spec isn't documentation written for humans — it's instructions written for the AI. Every rule should cite concrete file paths and paste real code examples from the project. "Prefer using X" is useless filler; say "handle errors with `toApiError()` under `src/api/`."

### 2. Workspace

The `.trellis/workspace/` directory — each developer's session journal. It lets AI remember across sessions what was done last time, keeping context coherent.

This is what sets Trellis apart from other tools. Specs are team-shared standards; the Workspace is personal working memory. Together, the AI knows both the project's standards and what you've been working on lately.

### 3. Task

The `.trellis/tasks/` directory — work units. Each Task contains a PRD, context configuration (JSONL), and subtasks. Full lifecycle: create → plan → execute → verify → archive.

Tasks make AI's work traceable. Not "gone when the conversation closes," but structured records you can revisit and hand off.

### 4. Skill

The `.agents/skills/` directory — auto-trigger workflow modules. The platform fires them based on context, no explicit command needed.

Five built-in Skills:

| Skill | Trigger | What it does |
|---|---|---|
| `trellis-brainstorm` | When the user describes a need | Clarifies requirements through Q&A, drafts the PRD |
| `trellis-before-dev` | Before touching code | Reads the specs and checklists for affected modules |
| `trellis-check` | After implementation | Reviews the diff against specs, runs lint/tests |
| `trellis-update-spec` | When there's knowledge worth keeping | Turns lessons into spec rules |
| `trellis-break-loop` | After fixing a nasty bug | Five-dimensional root cause analysis: classify → cause → prevent → spread → codify |

`trellis-break-loop` is an interesting design. Fixing a bug isn't just changing code — it means answering five questions: what type of bug is this? Why did it happen? How do we prevent it? How wide does the impact spread? What lesson gets written into the spec? This loop ensures bugs aren't just fixed, but understood.

---

## Daily Use: Three Commands

Trellis 0.5.0 uses a skill-first architecture; users only need to remember three commands:

**`/trellis:start`** — opens a session. Reads the workflow.md workflow contract and pulls in identity, git status, active tasks, and the spec index. Platforms with hook support trigger it automatically.

**`/trellis:continue`** — advances to the next step. The AI automatically judges which phase you're in (brainstorm → implement → check); you never have to memorize the workflow's stages. Just keep conversing and continue-ing.

**`/trellis:finish-work`** — wraps up and archives. Assumes the code is already committed. Archives active tasks, appends journal entries, and produces chore commits.

Typical flow: describe the need → AI brainstorms → `continue` → implement → `continue` → check → `finish-work`.

{{< image src="/pictures/note/trellis-workflow.svg" alt="Trellis daily workflow" caption="Trellis's daily workflow: start → describe the need → implement → check → codify, with continue advancing each step" >}}

---

## Installation and Initialization

Requirements: Node.js 18+ and Python 3.9+. Mac / Linux / Windows all supported.

```bash
# Global install
npm install -g @mindfoldhq/trellis

# Enter the project directory and initialize
cd your-project && trellis init -u your-name

# Or specify platforms explicitly
trellis init -u your-name --claude --cursor --windsurf

# Use a remote spec template
trellis init -u your-name --template electron-fullstack

# Use a team-custom registry
trellis init --registry gh:myorg/myrepo/specs
```

Init dispatches by scenario: a first init creates the skeleton plus a bootstrap task; a new developer joining generates a joiner onboarding task; adding a platform to an existing project lays down the configuration.

---

## Trellis + GitNexus Integration

GitNexus (40.5k stars) is a zero-server code knowledge-graph engine built on Tree-sitter ASTs + Graph RAG + 16 MCP tools, running fully locally.

Trellis owns the standards; GitNexus owns the code structure. Together, the AI doesn't just know "errors should go through `toApiError()`" — it also knows "touching this function affects 47 callers."

```bash
# Install and index
npm install -g gitnexus
cd your-project
gitnexus analyze              # Full index (AST + dependencies + call chains)

# Hook up AI coding tools (MCP)
claude mcp add gitnexus -- gitnexus mcp   # Claude Code
codex mcp add gitnexus -- gitnexus mcp    # Codex

# Initialize Trellis
trellis init -u your-name --claude
```

GitNexus provides five core capabilities:
- `analyze` — full Tree-sitter AST indexing
- `impact` — blast radius change-impact analysis
- `context` — a 360° symbol view (who calls this function, and what it calls)
- `detect-changes` — maps git diffs to affected symbols
- `mcp` — an MCP server AI can query directly

In large-project refactors, this combo is especially useful. While implementing, the AI automatically calls `gitnexus impact <symbol>` to see the change's blast radius, then verifies with `trellis-check` against specs + blast radius.

---

## Seven Real Scenarios

Trellis's official docs give 7 end-to-end cases. Here are a few of the more interesting ones, expanded.

### Fixing a Recurring Bug

Real case: Claude Code's SessionStart hook crashes with `TypeError: unsupported operand type(s) for |: 'type' and 'NoneType'`.

The surface cause: `str | None` syntax is incompatible with Python 3.9. But the real root cause: the AI CLI launches hook subprocesses with a stripped-down PATH, so `python3` resolves to the system's built-in 3.9 instead of the user-configured 3.11.

Trellis handles it with a seven-step closed loop:

1. `brainstorm` reproduction conditions and root-cause directions → prd.md
2. Configure check.jsonl to reference the relevant specs
3. `implement`: minimal stop-the-bleeding change, regression test added first
4. `check`: confirm the patch fixes it + the regression test fails without the patch
5. `break-loop`: five-dimensional root cause analysis → confirm whether recurrence is prevented
6. `update-spec`: prevention actions written into specs / checklists
7. `finish-work` to archive + journal record

The completion bar isn't just "bug fixed" — it's: the patch changes behavior + the regression test fails without the patch + the root cause is on record + prevention lives in spec/test/checklist. Next time the AI hits a similar scenario, it checks PATH configuration automatically.

### Cutting Repetitive Code Review

Reviewers keep writing the same kinds of comments: "missing loading state," "don't use any," "inconsistent error format," "there's already a helper for that."

Trellis's approach is to map this review feedback into spec rules:

| Review feedback | Spec rule |
|---|---|
| "Missing loading" | Async buttons must have all four states: idle / loading / success / error |
| "Don't use any" | Ban any in public component props; use explicit interfaces or generics |
| "Inconsistent error format" | All route handlers return the standard format via `toApiError()` |
| "There's already a helper" | Search `src/lib/formatters/` before adding formatting |

The flow: paste a PR link → brainstorm which patterns deserve codifying → collect repeated feedback from real PRs → `update-spec` writes the rules (each with good/bad code examples) → validate on the next task → after running 1-2 real tasks, look back and delete rules that caught nothing or generated noise.

The effect: reviewers can cite `.trellis/spec/` in PRs instead of re-explaining conventions every time.

### Onboarding an Existing Codebase

A codebase alive for three years, with conventions scattered across historical PRs, reviewer habits, and senior colleagues' memories. Steps to onboard:

1. `trellis init` → generates default spec templates + a `00-bootstrap-guidelines` bootstrap task
2. In the bootstrap task, the AI scans the repo and extracts real patterns (API routes, auth, logging, forms)
3. Require the AI to cite concrete file paths for every rule; delete any rule that can't be traced
4. Review the specs like you review code, then pick a pilot task to validate the effect

Good specs: real paths, real code examples pasted from the project, explicit API signatures, field types, environment variables, error types; one spec file, one topic. **An empty template does less harm than a wrong one** — if a rule has no real code to cite, you're better off not writing it.

### Refactoring an Old Module

`src/billing/invoice-service.ts`, 1,200 lines — billing math, discount handling, payment API calls, audit logging, email formatting.

Before refactoring, write down the invariants (into the PRD, confirmed by a human):
- Invoice totals must match the existing calculation
- Failed payment attempts must still be written to the audit log
- Email rendering output must be byte-for-byte compatible with the current template
- Public API response shapes must not change

Then split it apart safely layer by layer: add characterization tests to pin the baseline first, then **extract one responsibility at a time**, keeping public interfaces stable. Run the tests each round to confirm behavior is unchanged; if they fail, roll back.

Principle: tests first to lock behavior, then layered extraction, with every step safely revertible.

---

## Customizing Spec Templates

Templates aren't take-as-is. Every project should trim and extend them into its own standards.

Three ways to get them:
- `trellis init` — the built-in default templates
- `--template` — official templates (Electron / Next.js / CF Workers)
- `--registry` — a team's custom Git repo (v0.3.6+)

Template directory layout:

```
spec/
├── frontend/
│   ├── index.md
│   ├── components.md
│   ├── hooks.md
│   └── state-management.md
├── backend/
│   ├── index.md
│   └── ...
├── guides/
│   ├── index.md
│   └── ...
└── README.md
```

Custom registries support two modes: Marketplace mode (the repo contains `marketplace/index.json`, listing a template index to choose from) and direct-download mode (the whole `marketplace/specs/` downloads as a single template). GitHub / GitLab / Bitbucket are supported.

Fill them in progressively: you don't need to complete every spec file at once. Start with the parts that matter most to your project; the bootstrap task will guide you through the rest step by step.

---

## A Rollout Path for Teams

From a personal pilot to standardized use across a 50-person team, five stages:

1. **Pilot one repo** — complete a real task using specs / checks / journal
2. **Capture repeated feedback** — three to five review patterns distilled into specs
3. **Standardize the task workflow** — developers learn when to use /start, /continue, /finish-work
4. **Add platform adapters** — multiple AI tools consume the same `.trellis/` context
5. **Govern updates** — spec and workflow changes get reviewed like code

Each stage has explicit exit criteria. Don't skip stages — if the first one hasn't run clean, don't roll out to the team.

---

## Notes from Actual Use

Enough mechanics — a few hands-on impressions:

**Spec quality decides everything.** All of Trellis's automation rests on the assumption that the specs are well written. Vague specs produce vague execution. Time spent polishing specs is time well spent.

**Cross-session memory genuinely helps.** Not re-explaining "what framework does this project use" or "how are errors handled" saves more than time — it saves mental energy.

**Don't over-rely on automation.** `trellis-check` catches a lot, but not everything. It catches what the specs cover — what isn't written in a spec, it doesn't know. Human review remains necessary.

**GitNexus is a bonus, not a necessity.** Small projects have no use for a code knowledge graph. The payoff only shows up in large-project refactors.

---

## Getting Started

```bash
npm install -g @mindfoldhq/trellis
```

- [Official docs (Chinese)](https://docs.trytrellis.app/zh)
- [GitHub repo](https://github.com/mindfold-ai/Trellis)
- [GitNexus](https://github.com/nicholasgriffintn/gitnexus)

Trellis isn't a silver bullet. It solves "the AI doesn't know your standards," but the precondition is **that you have standards to write down**. If the project itself has no clear coding standards, Trellis can't help you — it's a conduit for standards, not their source.

But if your team already has standards — just scattered everywhere and re-explained by hand every time — Trellis is worth a try.

