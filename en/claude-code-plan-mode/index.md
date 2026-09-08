# Plan Mode and Design-First: Making AI Think Before It Acts


<!-- more -->


Hand an architect a plot of land and he won't start laying bricks immediately. He draws first, calculates load, considers daylight, plans the plumbing. Only when the blueprints are confirmed does the construction crew move in.

Hand an AI coding assistant a requirement and by default it starts editing code immediately. Not because it doesn't understand "design first", but because **its loop mechanism rewards action** — in the Think-Act-Observe loop, "Act" is the core capability. The model is trained to be "helpful", and "helpful" in a coding context usually means "start changing things".

Plan Mode exists to interrupt that impulse.

## What Plan Mode Is

Plan Mode is a permission mode in Claude Code. When enabled, the agent can read but not write — it can view files, search code, and run read-only commands, but it cannot modify files or perform operations with side effects.

On the surface it's just another permission level (we covered the 5-level permission model in post 4). But Plan Mode is more than permission control — it's an **enforced separation of workflow phases**.

Plan Mode answers an overlooked question: **an AI coding assistant needs a clear boundary between "understanding the problem" and "solving the problem".**

## Why "Think Before Acting" Matters So Much for AI

Human programmers instinctively think before acting — experienced ones, at least. Given a requirement, you run it through your head first: which files are involved, how wide the change is, what edge cases exist, how the tests should be written.

AI has no such habit. Not because it can't think, but because it feels no impulse to separate "thinking" from "doing". To the model, thinking is text and acting is text — at the output level there's no essential difference between them. Without an external constraint (Plan Mode), the model tends to jump from "thinking" to "acting" as fast as possible, because "acting" (generating code) is its core training objective.

Plan Mode enforces a cognitive separation by technical means:

**Plan phase (read-only)**:
- Read existing code, understand the architecture
- Identify files that need changes
- Analyze dependencies and potential impact
- Draft a change plan
- Present the plan to the user and wait for confirmation

**Execute phase (read-write)**:
- Execute changes per the confirmed plan
- Write or update tests
- Run verification

Between the two phases sits an explicit **human confirmation point**. The user sees the AI's plan and can suggest changes, adjust direction, or throw it out entirely. This checkpoint is a gate between "thinking" and "doing".

## Separating Read, Think, and Write

Plan Mode at its core is a **three-phase separation of read, think, and write**:

**Read** — the agent scans the project and gathers information: read files, inspect dependencies, check tests, analyze structure. This phase produces "facts".

**Think** — the agent plans based on the gathered facts: analyze impact scope, design the change, assess risk. This phase produces "decisions".

**Write** — the agent executes the plan and modifies code. This phase produces "changes".

Each phase has different inputs and outputs:
- Read takes the filesystem as input and outputs facts
- Think takes facts as input and outputs decisions
- Write takes decisions as input and outputs changes

The benefit of separation: **each phase can be reviewed and optimized independently**. You can check whether "read" was thorough (any missed key files), whether "think" was sound (is the plan right), whether "write" was accurate (does the code match the plan). Mix the three together and review gets hard — reverse-engineering the AI's reasoning from a pile of code changes is nearly impossible.

## Plan Mode's Quality Gains

Why does Plan Mode improve code quality? Because it intercepts the three most common classes of AI coding errors:

**Misunderstanding.** The AI starts editing before grasping the existing code's logic and breaks implicit dependencies. Plan Mode forces read-then-think, so misunderstandings surface in the "think" phase.

**Wrong scope.** The AI changes only the obviously related files and misses indirectly dependent ones. Plan Mode's analysis phase requires listing all affected files, and the user can check for omissions.

**Wrong direction.** The AI's understanding diverges from the user's intent, and it discovers this only after half the code is changed. Plan Mode gets the direction confirmed before any change, so divergence is corrected at zero cost.

All three share one property: **the earlier they're caught, the cheaper they are.** Correcting a wrong direction in the Plan phase costs nearly nothing (a few tokens burned); in the Write phase it means rolling back changes; found in production, it can be an incident.

## Plan Mode and Multi-Agent

Plan Mode and the multi-agent architecture (post 8) complement each other subtly.

The multi-agent architecture has a dedicated Plan role — it takes Explore's findings and produces an execution plan. Plan Mode is a permission state — it restricts the agent to read-only.

The two compose: launch a Plan-role subagent under Plan Mode for deep analysis. Plan Mode provides the safety boundary (no accidental modifications); the Plan role provides the professional methodology (structured analysis).

But they also stand alone: Plan Mode doesn't need multi-agent (a single agent can plan in read-only mode), and multi-agent doesn't need Plan Mode (the Explore role is already read-only; no extra restriction required).

## When You Don't Need Plan Mode

Plan Mode isn't a silver bullet; it has costs — extra tokens, extra waiting, extra interaction steps. Not every task deserves a plan.

Scenarios fine without Plan Mode:
- **Simple changes** — "rename this function from foo to bar"
- **Local fixes** — "this test is failing, fix it"
- **Incremental additions** — "add a loading state to this component"

Scenarios that need Plan Mode:
- **Architectural changes** — "migrate Redux to Zustand"
- **Cross-module changes** — "refactor the error-handling mechanism"
- **Vague requirements** — "help me think through adding a user permission system"

The criterion is **change scope and uncertainty**. Small scope with high certainty doesn't need planning; large scope with high uncertainty must have it.

## The Philosophy of Plan Mode

One design philosophy sits behind Plan Mode:

**The biggest risk of an AI coding assistant isn't failing to produce code — it's producing code pointed in the wrong direction.**

If it can't write the code, the user writes it. If it writes code in the wrong direction, the user spends far more time discovering it, rolling it back, and re-steering. Wrong direction costs far more than inaction.

With one simple design decision — a forced read-only planning phase before action — Plan Mode drops the cost of a wrong direction from "code level" to "text level". A plan is text; a wrong direction just needs replanning. Action is code; a wrong direction means rolling back changes.

**Making failures happen where they're cheap — that's Plan Mode's core value.**

## Further Reading: Why BYF Removed Plan Mode

[BYF](https://github.com/ByronFinn/byf) made the opposite choice from Claude Code: **in ADR 0008, BYF deliberately removed Plan Mode.**

Not because Plan Mode lacks value, but because BYF's context-minimization review judged it "premature abstraction":

- **Token cost**: the EnterPlanMode (~572t) + ExitPlanMode (~853t) tool descriptions consume about 1425 tokens every time. Add the PlanModeInjector's periodic reminders (300-800 characters each), and the overhead accumulates noticeably across long sessions.
- **TUI complexity**: the CLI/TUI layer carries 30+ references (the `/plan` slash command, shortcuts, plan card rendering, the approval panel, footer badge).
- **Architectural spread**: Plan Mode touches agent-core (state machine, permission policy, injection system), the SDK (RPC passthrough), the CLI (TUI state), vis (wire record rendering), and wire records (`plan_mode.*` event types).
- **Usage**: users can get the same effect by simply saying "make a plan first" in natural language — no special mode needed.

BYF's conclusion: **Plan Mode enforces a binary state (planning vs. executing), while an agent should interleave exploration and action fluidly.** After removal, BYF saved roughly 73 code files and ~1425 tokens of tool-definition overhead, and simplified the user's mental model — no need to learn "when to enter the mode".

This doesn't negate Plan Mode's value. Claude Code keeping it and BYF removing it are both defensible — it depends on your users and your design philosophy. Claude Code gives users an explicit "plan button" as a safety net; BYF trusts users to naturally say "think it through first" in their own words. Both choices involve trade-offs; what matters is **making the trade-offs consciously**.

## Next Up

That wraps Phase 2. From context compaction through memory, Skills, multi-agent, MCP, and Plan Mode, we've seen how an AI agent's advanced capabilities are built.

Phase 3 zooms out. Next up, a bold comparison: **3,000 lines vs. 500K lines** — what exactly separates claude-code-from-scratch's minimal implementation from Claude Code's real source? From toy to product, how many engineering details hide in the architectural abyss?

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

