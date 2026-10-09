# How I Actually Judge Whether an Agent Skill Is Worth Keeping

- Date: 2026-10-08
- Author: ByF
- URL: https://blog.baifan.site/en/evaluating-agent-skills-first-principles/
- Description: Maintaining dev-skills taught me that showcase bias is the default mode of skill evaluation. Here's how I moved from gut-feel to a workable testing approach — through task spec contamination, LLM judge distortion, and a cost ledger I forgot to keep.

---


By the time I was maintaining the fifteenth or so skill in `dev-skills`, I realized I had no reliable way to tell whether any of them actually worked. Every demo produced clean output. But the output had no control group, no causal grounding — I knew what happened with the skill mounted, not what would have happened without it.

<!-- more -->

## How I Was Judging at the Start

The original method was simple: write a skill, load it into Claude Code, run a task, check whether the output looked right. The first version of `grill` passed this way — I fed it a service design with a concurrency bug, the agent flagged a lock contention issue, I marked it valid.

Later I ran the same design without the skill. Same model, same task. The model still identified the lock contention. Just phrased differently.

Single-point demos measure model capability, not skill contribution.

The design rationale for `dev-skills` is covered in {{< ref "posts/2026-06-22-claude-code-skills-system" >}} — a skill is a set of behavioral directives injected into context on demand. The whole premise is that it makes the model do something different and better. "Better" requires a baseline to be meaningful.

## First Attempt at a Control Group: I Wrote the Task Spec Wrong

Once I decided to run paired experiments — same task, two arms, one with the skill, one without, everything else identical — the first result came back as a tie.

The task was reviewing a distributed cache design. Both arms produced nearly identical outputs.

I read through the task spec and found the problem immediately. I had written: "please carefully evaluate potential race conditions and resource leak risks." That's exactly what `grill` instructs the model to do internally. I had leaked the skill's methodology into the baseline arm's task description, artificially equalizing both arms before the experiment even started.

After that, task specs got a hard rule: state only the goal (what to review), context (system background), hard constraints (interfaces and dependencies that can't change), and deliverable format (what kind of report is expected). Any reasoning step or methodology that appears in the skill text is banned from the task prompt.

In practice this is harder than it sounds. The more naturally you write a task spec, the more you inadvertently smuggle in the skill's process hints. My current habit is to write the spec first, then scan the skill text line by line and flag any task sentences containing method verbs — "verify," "check," "ensure," "analyze" — before accepting the spec as clean.

## Scoring With an LLM Judge: The Next Hole

With cleaner task specs, the problem shifted to scoring.

I tried feeding both outputs to a separate model and asking it to pick the better one. Low cost, easy to automate, seemed reasonable.

The results had no signal. The LLM judge systematically favored longer responses, cleaner Markdown structure, and better-organized paragraph breaks. None of that correlated with whether the output had actually identified real architectural problems. Whichever arm produced something that looked more like a consulting deliverable won, regardless of actual defect coverage.

The scoring now runs in three tiers, hardest first.

**Tier 1 — Deterministic verification**: anything that can be checked by a script, gets checked by a script. Hidden test suite exit codes, linter pass/fail, correct API usage. No subjectivity, no model in the loop. Exit Code 0 or 1.

**Tier 2 — Gold-standard checklist**: I pre-embed known defects into the evaluated artifact and score by recall — how many did the skill arm catch, how many did the baseline catch. For `grill` this means planting five specific problems in the design under review (a concurrent write race, a connection pool leak, a cache stampede scenario, missing graceful degradation, a monitoring gap), then counting hits. "Feels more professional" never appears in a benchmark report.

**Tier 3 — Double-blind human audit**: for outputs with genuinely subjective dimensions, artifacts get stripped of all tool telemetry and metadata, then reviewed by two evaluators in swapped order. Each evaluation must cite at least two concrete flaws from the text. Scores without specific evidence are rejected.

## The Cost Ledger I Forgot to Build

After fixing the three problems above, I thought the framework was basically sound.

Then I ran a controlled test on the `think` skill — the one that asks clarifying questions before writing any code, to converge on the actual requirement boundary. Quality delta showed the skill arm recovering more implicit requirements. I logged it as a win and moved on.

Later I went back and tallied the token consumption. The static injection plus the multi-turn interaction `think` triggers added roughly 12,000 tokens per task on average. For ambiguous tasks where the clarification is actually needed, that's defensible. But mounted on everything — including tasks where the requirement is already unambiguous — it's just overhead.

After that, every benchmark report carries two separate ledgers: quality delta and cost delta, not combined. Collapsing them requires a conversion rate between quality and cost that varies by context and shouldn't be decided by the evaluation framework on behalf of whoever is running the system.

`grill` is the extreme case: a full run adds roughly 30,000 tokens. If it catches a distributed deadlock before production, that cost is negligible for a service under real concurrency load. The prerequisite is that your service actually faces that kind of risk — running `grill` on a single-process batch job is a waste with a methodology paper written around it. What the ledger does is force that trade-off to be made explicitly, by the team that knows the operational context, not implicitly by the benchmark.

## What the Current Process Looks Like

**Difficulty calibration**: run the task without any skill first and measure baseline pass rate. Above 80% means the base model handles it easily with or without the skill — the task needs harder edge cases or realistic distractors injected until baseline sits between 40% and 70%. This is tedious. Skip it and the benchmark has no discriminatory power.

**Parallel sandboxed execution**: physical isolation, identical model version, temperature, and seed. The only variable is whether the skill text and its full dependency closure appear in context.

**MD5 identity gate**: if both arms produce identical output by hash, the task has a single deterministic solution — the sample gets discarded. This happens most often with format-conversion tasks.

**Deterministic checks first**: scripts before humans, always.

**Anonymized blind review**: tool call metadata stripped before the artifact reaches any evaluator. Evaluators don't know which arm produced which output.

**Dual-ledger report**: quality delta and cost delta side by side, not merged.

## What Actually Makes a Good Skill

Running these experiments gave me a much sharper opinion about what should go into a skill before it's evaluated at all.

The common mistake is treating a skill like technical documentation — where thoroughness and systematic coverage are virtues. But documentation is written for humans who can re-read, skip around, and re-orient themselves at will. A skill is different. Once injected into context, it competes in the same attention computation against the task description, code excerpts, tool call results, and the model's pretrained weights. The longer and more complex the task, the smaller the skill's effective attention share. Under execution pressure, the model defaults back to whatever pattern dominated its training data — not what the skill text says.

That constraint changes the entire logic of what "writing a skill" means.

**The problem with process descriptions**

"Write a failing test first, then implement, then refactor" — looks clear enough. In practice, models handle the first two steps reasonably well and skip refactoring routinely. More commonly, the model writes the implementation first, then appends a test that initially fails, satisfying the literal text while completely defeating the intent of test-first design.

Process descriptions treat execution order as a constraint. It isn't. Without observable checkpoints at each step, models reorder steps under pressure without signaling that they did.

**The problem with rationale explanations**

"We write tests before implementation because post-hoc tests can't constrain design decisions made during coding" — that's rationale. A model that understands *why* can generalize to cases the procedure doesn't cover. That's rationale's advantage.

But rationale is expensive in tokens. And GPT-4o, Claude Sonnet 4, Gemini 2.5 Pro — all of these have absorbed enormous volumes of writing about why TDD matters, why architectural review catches bugs, why you shouldn't assume requirements. That knowledge is already in the weights. Re-explaining it in the skill context buys comfort, not behavior change.

As model capability grows, this compounds. The more common knowledge a skill explains, the faster it becomes dead weight.

**Negative constraints outperform positive instructions**

"Always clarify the requirement boundary" versus "do not begin implementation when the requirement contains unresolved ambiguity" — same intent, but in controlled tests the negative form consistently wins.

The reason: the model already carries a positive disposition toward completing tasks. Positive instructions reinforce a tendency that's already there. Negative constraints suppress a specific default behavior, with an observable failure mode you can check against.

This shows up most clearly in `grill`. "Identify all potential risks" produces almost no effect — the model was already identifying whatever risks it considered significant. "Confirm all four deadlock preconditions (circular dependency, hold-and-wait, no preemption, mutual exclusion) are simultaneously present before asserting deadlock — do not conflate race conditions with deadlocks" — this constraint blocks a specific error pattern, and the effect is directly measurable against the pre-embedded defect checklist.

**Examples cost fewer tokens than abstract rules**

A bad/good example pair almost always transfers behavior more efficiently than the same number of tokens spent on an abstract rule. The mechanism is straightforward: pretraining is fundamentally pattern induction from examples. Examples in context activate the same machinery.

This doesn't mean rules are useless. Edge cases that examples can't cover still need explicit rules. But if a directive can be expressed as a concrete bad case paired with its correction, the example form is almost always more token-efficient.

**Model capability growth causes effective skill content to shrink**

The `tdd` skill in its Claude 3 incarnation spent most of its tokens explaining how to write meaningful tests — process plus rationale, roughly 1,500 tokens. Claude Sonnet 4's testing capability is substantially better; that content is now entirely redundant. What remains are three hard constraints: commit timing (test file modification timestamp must precede the implementation file), naming (test names must describe failure scenarios — `test_valid_case` is banned), and assertion strength (`assertTrue(result is not None)` counts as zero-information and is treated as no test). Everything else is gone.

The structural conclusion here: skill content that explains general best practices has an expiration date tied to model training cycles. What retains long-term value is the opposite: places where the model's default "correct" behavior is wrong *in this specific project and operational context*. That knowledge isn't in training data and won't be absorbed through model upgrades. It's the only content a skill can't be replaced by a better base model.

**One test before writing any directive**

Before adding a rule to a skill: would the model do the right thing here without this rule?

If yes — the rule is redundant. Cut it.

If no, with an empirical case to prove it — the rule earns its tokens.

A good skill is compressed differential engineering judgment. Fewer tokens means higher attention density per token means more reliable execution. The goal is not completeness. The goal is minimum viable constraint.

## Things I Don't Have Good Answers to Yet

Interactive skills are still a problem. `think`'s value is in asking questions, but there's no real user in a benchmark environment. I use a controlled simulator — a hidden requirements dossier that returns cached, deterministic answers when both arms ask the same question — to remove conversational noise. But the simulator can't replicate how real users phrase things ambiguously, change their minds mid-conversation, or misunderstand a question. A result of "skill effective" under simulator conditions doesn't guarantee the same under real usage.

The other unsolved issue is heterogeneity within a skill. As covered in {{< ref "posts/2026-08-05-give-ai-a-rulebook" >}}, a skill with ten directives usually has two or three that do real work, several that are neutral, and at least one that's actively counterproductive. The current framework can determine whether the skill as a whole has positive net value. It can't tell which individual directives are pulling weight and which should be removed. I don't have a clean solution for that granularity yet.

The evaluation framework itself costs tokens, time, and attention. Having one doesn't produce answers — it just makes the questions harder to dodge.

