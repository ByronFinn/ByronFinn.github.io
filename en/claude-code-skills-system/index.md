# The Nature of Skills: Reusable Encapsulated Expertise


<!-- more -->


If you've used Claude Code, you may have noticed the `/skills` command listing installed "skills". Writing standards, architecture design methods, TDD workflows, code review strategies — it sounds like a plugin marketplace.

**Skills are not plugins.**

That's the first and most important thing to understand about the Skill system. A plugin is code — it extends what the program can do. A Skill is a prompt — it extends what the model knows.

Plugins let an agent **do new things** (connect to a database, call an API). Skills let an agent **do known things better** (write in a particular style, design architecture by a particular methodology).

## What a Skill Is

A Skill is essentially a structured Markdown file holding the knowledge, processes, and standards of some professional domain. It might look like this:

```markdown
# Code Review Skill

## Activation
Activate when the user requests a code review, PR review, or similar task.

## Review Workflow
1. Read through the entire change first to understand intent
2. Check functional correctness
3. Check code style and maintainability
4. Check security
5. Check test coverage
6. Give structured feedback

## Feedback Format
- [Critical] issues that must be fixed immediately
- [Suggested] improvement suggestions
- [Optional] style preferences
```

When this Skill activates, its content is injected into the "Skill layer" of the system prompt. Seeing this professional guidance, the model can run code reviews in a more structured way.

A Skill executes no code, registers no callbacks, extends no CLI commands. It's just a **carefully organized piece of prompt**, stuffed into the prompt when needed.

## Why "Skill" and Not "Plugin"

The naming reveals the design intent.

A plugin implies "capability extension" — it adds new abilities to the system. VS Code's Python plugin gives the editor syntax highlighting, debugging, and linting. The browser's AdBlock plugin gives it ad filtering.

A skill implies "expertise" — it makes existing abilities more professional. A programmer who can code and a programmer who can code and knows TDD share the same "capability" (programming) but differ in "skill". The latter naturally writes tests while coding and follows the red-green-refactor cycle.

Claude Code's model already knows how to program. A Skill doesn't teach it "how to program"; it teaches "by which methodology to program".

## On-Demand Loading vs. Full Injection

Skills face the same problem as the tool system: **the context budget.**

Install 10 Skills at 500 tokens each and full injection costs 5000 tokens — 2.5% of a 200K window. Sounds small, but with longer Skill content (a complete architecture methodology can run 2000+ tokens) or more Skills, the overhead becomes impossible to ignore.

Claude Code's strategy is **on-demand loading**: a Skill's description (a one-line summary) is always in the system prompt, but the full content is injected only on activation.

Activation is the model's call. When it understands the current task relates to a Skill, it "activates" it — in practice, requesting the Skill's content via a special tool call; the system injects the full content, and on the next loop iteration the model "has" that professional skill.

It's the same idea as the tool system's progressive disclosure we discussed earlier: **nothing urgent to load if unused; load when used.** The difference: a tool's description is a structured schema, a Skill's is a natural-language summary.

## Skills and MCP

If you read my earlier post on [MCP progressive disclosure](mcp-claude-skills-progressive-disclosure), you'll notice Skills and MCP tools share the "load on demand" idea. But they solve problems at different layers:

- **MCP tools** extend an agent's **capacity to act** — which services it can connect to, which APIs it can call, which external systems it can operate.
- **Skills** extend an agent's **cognitive capacity** — which methodologies it knows, which standards it follows, which frameworks it thinks in.

A vivid analogy: MCP tools give the agent new "limbs" (hands, feet, eyes); Skills give the agent new "knowledge" (experience, methodologies, best practices).

Both load on demand; both live under the context budget. But their essence differs. Tools are **verbs** (what to do); Skills are **adverbs** (how to do it).

## Skill Reusability

A Skill's most valuable property isn't "expertise encapsulation" but **reusability**.

A well-written Skill can be shared across projects and users. A "TDD workflow" Skill works in a React project and a Rust project alike. A "code review" Skill is useful for any codebase.

Claude Code stores Skills under `.claude/skills/`, versioned by Git and distributed with the project. A team can share a Skill set so every member's agent has the same expertise.

This means a Skill isn't just a "personal assistant capability extension" — it's a **formal carrier of team knowledge**. A senior engineer's code-review experience can be written as a Skill, giving every teammate's AI agent the same reviewing ability.

There's a subtle distinction from CLAUDE.md:
- **CLAUDE.md** holds project-specific conventions ("this project uses Redux")
- **A Skill** holds cross-project methodology ("follow this workflow when reviewing code")

CLAUDE.md answers "how things are done in this project"; a Skill answers "how this kind of thing is done".

## The Limits of Skills

Skills aren't a silver bullet. They have clear limits:

**They depend on the model's comprehension.** A Skill is a prompt, not code. The model may "read" the Skill without truly "following" it. Especially when a Skill's guidance conflicts with the model's default behavior, it may ignore the Skill and follow its own habits.

**They can't force compliance.** The Skill says "write tests before code"; the model may do the reverse. The Skill says "use structured feedback"; the model may produce free-form text. Skills are soft constraints, enforced by the model's willingness to cooperate.

**Their quality varies.** A Skill's effectiveness depends on how well it's written. A vague Skill produces vague behavior; a contradictory Skill produces chaotic behavior. Skills need to be reviewed and maintained like code.

All these limits share one root: **a Skill is natural language, not a formal spec.** Natural language is flexible but imprecise — good at expressing intent, poor at enforcing it.

## The Philosophy of the Skill System

One design philosophy sits behind Claude Code's Skill system:

**Expertise should be encapsulated, reused, and shared — not just among humans, but among AIs.**

This idea matters more than Skills themselves. It hints at a future where expertise no longer lives only in human brains or documents, but is encoded in formats AI can understand — activated, applied, and iterated on demand.

Skills are a rough prototype of that future. Imperfect — prompts rather than code, soft constraints rather than hard rules — but they point in a direction: **formalized knowledge, propagated automatically.**

## Further Reading: BYF's Progressive Skill Disclosure and update-config

[BYF](https://github.com/ByronFinn/byf) does two noteworthy things with its Skill system.

**1. More thorough progressive disclosure.** BYF's ADR 0009 explicitly defines Skills as "inject only the name plus a one-line description; load full content on demand via the `Skill` tool". Its context-minimization review found that injecting the full skill list costs 500-1500 tokens — not fatal at current scale, but the accumulation erodes cache efficiency. BYF's strategy matches Claude Code's: descriptions always in the system prompt, full content injected only on activation.

**2. `update-config` as a built-in Skill.** BYF's most creative Skill application. The `/skill:update-config` command has the agent read `~/.byf/config.toml`, apply the governance rules embedded in the Skill itself (a deprecated-field table, the `default_thinking` migration, raw-passthrough cleanup) plus code facts about the schema and runtime providers, audit the config, and repair it automatically. The rules ship with BYF and evolve with every release.

What does that mean? **A Skill is no longer "auxiliary prompt text" — it becomes a programmable ops tool.** `update-config` isn't a doc telling the user "please fix your config manually"; it's an agent that acts — reading real files, comparing against the latest rules, making the changes. The Skill's boundary stretches from "tell the model how to do things" to "tell the model what to do — and inject the knowledge before it does".

This practice breaks the original positioning of Skills as "prompt modules" and points to an interesting future: **a Skill can be a "domain expert" embedded in the agent runtime, ready at any moment to be woken, invoked, and authorized to act.**

## Next Up

Skills make a single agent more professional. But some tasks are too complex for one agent — even with every Skill installed. Next up: Claude Code's **multi-agent architecture** — why one AI loses to three AIs, the division of labor among the explore, plan, and general roles, and how the fork-join pattern collaborates in practice.

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

