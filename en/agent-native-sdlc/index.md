# The Next Phase of AI Coding: Rebuilding the SDLC

- Date: 2026-10-11
- Author: ByF
- URL: https://blog.baifan.site/en/agent-native-sdlc/
- Description: Faster coding hasn't led to faster delivery. Industry data shows delivery stability remains under pressure, shifting the bottleneck from typing code to review queues and automated testing. The next phase focuses on pipeline overhaul: test-first criteria, tiered review automation, guardrails for non-engineers, and engineers owning architectural decisions.

---


Everyone on the team writes code several times faster, but delivery cycles haven't gotten any shorter. The surge of newly generated code simply overwhelmed the downstream review queue and integration pipeline. The bottleneck didn't vanish; it moved from the text editor to code review and release verification.

<!-- more -->

## Coding Got Faster, Delivery Didn't

AI has not made software delivery faster overall, and empirical industry data still fails to back that claim.

The DORA report is the largest ongoing study of engineering effectiveness. Its 2024 edition ([announcement](https://cloud.google.com/blog/products/devops-sre/announcing-the-2024-dora-report)) showed that for every 25% increase in AI adoption, delivery throughput dropped an estimated 1.5%, while delivery stability dropped 7.2%. The 2025 edition ([announcement](https://cloud.google.com/blog/products/ai-machine-learning/announcing-the-2025-dora-report)), covering nearly 5,000 developers, saw throughput correlation flip slightly positive, but stability remained negatively correlated. The underlying dynamic is straightforward: AI accelerates code generation, but without automated testing, disciplined version control, and fast feedback loops, higher change volume translates directly into production incidents.

This is survey research across cross-sectional samples, and the throughput correlation shifted across consecutive years, meaning one should look at directional trends rather than point estimates. Yet across two distinct years and two large samples, stability showed the same negative correlation.

This dynamic aligns with the Theory of Constraints (Goldratt, *The Goal*, 1984): overall pipeline throughput is dictated by its narrowest bottleneck. Accelerating a non-bottleneck stage does not increase net output; it merely piles up unfinished work in front of the constraint. Typing code used to be the slowest phase. AI eliminated typing friction, pushing the clog directly into code review, merge conflict resolution, and integration testing. Writing code faster only lengthens downstream queue times.

Repository-level data confirms this degradation. GitClear's 2025 annual report ([link](https://www.gitclear.com/ai_assistant_code_quality_2025_research)) analyzed 211 million lines of code changes and found that 2024 was the first year where copy-pasted code exceeded moved (refactored) code. Moved lines dropped from 24.1% in 2020 to 9.5% in 2024, while copy-pasted code rose from 8.3% to 12.3%. Its 2026 report ([link](https://www.gitclear.com/the_ai_code_quality_maintainability_gap)) showed moved lines falling to 3.8% in the first half of 2026, cross-file function calls dropping 35% since 2023, and developers becoming five times more likely to duplicate logic than refactor it into shared functions. Commits containing duplicate blocks of five or more lines surged roughly tenfold over two years. Because generating code costs nothing, developers prompt an assistant for another snippet rather than abstracting existing logic. Every duplicate introduces another hidden trap requiring manual fixes down the road.

Subjective developer perception is equally misleading. In METR's July 2025 [randomized controlled trial](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 16 experienced open-source developers tackled 246 real issues in repositories they knew intimately. The group permitted to use AI was actually 19% slower. Yet prior to the test, those developers expected a 24% speedup, and even after finishing, they believed they had worked 20% faster. The immediate feeling of watching code scroll across a screen has little to do with actual completion speed. The time spent troubleshooting edge cases, debugging hallucinations, and fixing subtly broken assumptions consumed all typing savings.

Faster typing does not turn into faster delivery on its own. Without restructuring review and verification, extra code just sits in a longer queue.

## Pin Down Boundaries and Tests Before Handing Work to AI

The more capable the AI model, the more critical it is to establish requirements and acceptance criteria before implementation begins.

METR's attribution analysis identified the primary slowdowns: over-optimism about AI capabilities and unwritten repository context. An AI agent behaves like a newly hired engineer who knows generic syntax and algorithms but knows nothing of a repository's tribal knowledge: which abstractions must never be bypassed, which legacy singletons cannot handle concurrent access, or what level of test coverage is mandatory. Human engineers spend years learning these boundaries. When handed vague instructions like "optimize this query" or "refactor user management," the agent is forced to guess. Lacking context, it generates plausible-looking code that introduces hidden failures. As task scope expands, the agent touches more unwritten rules, increasing the odds of breakage.

Upfront planning serves one purpose: turning unwritten tribal knowledge into explicit constraints. This means stating clear intent, circumscribing file modifications, and providing automated test assertions. Claude Code structures its workflow into exploration, planning, implementation, and commit phases (methodology detailed in [our Plan Mode breakdown]({{< ref "posts/2026-06-29-claude-code-plan-mode" >}})), anchored on giving the model a concrete pass-or-fail signal.

Task specifications should avoid vague methodology verbs such as "analyze," "optimize," or "refactor." Asking to "optimize query latency" invites unbounded changes to business logic. Instead, state four explicit components: the target objective, the system background, strict negative constraints, and expected deliverables. This principle came out of a scrapped controlled experiment documented in [that skill-evaluation post]({{< ref "posts/2026-10-08-evaluating-agent-skills-first-principles" >}}). The sharper the tests and constraints defined beforehand, the more predictable the execution.

## Code Review Must Hand Its First Line of Defense to Automation

When code generation volume doubles, manual review faces a dilemma: review thoroughly and watch pull requests accumulate indefinitely, or rubber-stamp changes and suffer production outages.

Developer surveys reflect this tension. In the [Stack Overflow 2025 survey](https://survey.stackoverflow.co/2025/ai), 46% of respondents distrusted AI accuracy, and 75% sought human help specifically because they distrusted AI answers. Throwing more headcount or longer hours at review queues cannot scale against automated code output. The only viable path is a tiered automated pipeline:

1. Deterministic machine checks: Linting, static analysis, type checking, unit tests, and build integration. Any check that returns a clear exit code (0 or non-zero) belongs entirely to automated CI. Failing checks bounce immediately without taking any human attention.
2. Rule-based filters and automated initial screening: Recurring human review feedback should be codified into static analysis rules or linter checks. AI-assisted review tools can filter out syntax slips, unhandled null pointers, and infinite loops before a human opens the diff.
3. Humans as the final arbiter: Senior engineers focus on high-leverage decisions machines cannot make—evaluating architectural soundness, verifying business logic, and inspecting high-risk failure modes.

Atlassian demonstrated this in practice. In April 2026, it published [internal evaluation data](https://www.atlassian.com/blog/ai-at-work/developer-productivity-improved-with-rovo-dev) across 1,900 repositories over a year of online experimentation. Using tiered quality gates, median pull request turnaround dropped 30.8%, while human review comments fell 35.6%. Crucially, the resolution rate of AI comments stood at 38.7%, compared to 44.45% for human reviewers. Automated review did not surpass human expertise, but it removed engineers from the mechanical first pass.

## Non-Engineers Modifying Code Requires Ironclad Guardrails

Tiered review automation enables a new workflow: allowing non-engineers to make safe direct modifications.

In practice, product managers know best where a button belongs, UX designers know where users abandon onboarding, and business analysts know which report column has become obsolete. Modifying two lines of copy or adjusting a display layout traditionally required filing a ticket, waiting for a sprint, undergoing review, and waiting for a release—a process spanning weeks.

With AI assistance, non-engineers can adjust front-end templates or configuration files directly. This cannot mean giving unconstrained push access to the main branch. The approach works only when supported by engineering safety infrastructure:
- Scope isolation: Permissions restrict edits to specific templates, style sheets, or copy dictionaries, preventing modifications to business core logic and database layers.
- Automated sandboxes: Every change automatically deploys to an isolated preview environment and runs an end-to-end regression suite.
- One-click instant rollback: If production anomalies appear, changes revert within seconds without side effects.

Real-world observation shows non-engineer output typically tops out at runnable prototypes: the main logic holds, but edge cases, race conditions, and long-term maintainability are neglected. This workflow speeds up routine adjustments; it does not eliminate the necessity of software engineering discipline. The division of labor was analyzed in [Thoughts on Team Roles]({{< ref "posts/2026-08-03-team-roles-evolution-ai-era" >}}). Underlying system robustness still depends entirely on senior engineers.

## When Production Breaks, Humans Bear the Blame

The list of tasks AI can handle keeps growing: generating code, running tests, resolving errors, and suggesting refactorings. The accountability list remains unchanged: when production goes down, humans answer for it.

Authoritative guidance reinforces this boundary. Atlassian's report states that final approval authority remains exclusively with human reviewers. Anthropic's [agent-building guide](https://www.anthropic.com/engineering/building-effective-agents) treats human review as indispensable for keeping implementations aligned with system requirements. DORA 2025's central takeaway is blunt: AI does not fix broken team processes; it amplifies what already exists. Disorganized workflows collapse faster when accelerated by AI.

During major production outages, no model gets put on a performance improvement plan or pays for commercial damages. Responsibility always flows through human organizational structures: whether requirements are sound, whether the architecture is resilient, and whether high-risk changes were properly vetted remain the responsibility of the engineers and managers who sign off on deployments.

Traditional metrics for evaluating human-AI collaboration are struggling as well. In February 2026, METR announced it was ending its developer uplift study ([announcement](https://metr.org/blog/2026-02-24-uplift-update/)) after 30% to 50% of participants admitted withholding tasks they felt reluctant to perform without AI, biasing the sample. If the measurement methods themselves require redesign, engineering pipelines cannot rely on old assumptions.

## Shifting Focus from Code Writing to Verification and Boundaries

The initial adoption curve for developer tools has largely plateaued. DORA 2025 found that 90% of practitioners use AI at work, while [GitHub Octoverse 2025](https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/) counted over 1.13 million public repositories integrating language model SDKs, up 178% year over year. Equipping developers with chat assistants has hit diminishing marginal returns.

The primary bottleneck in software development has shifted: from typing code to re-architecting the pipeline that governs collaboration between humans and machines:
1. Requirements expressed as executable tests: Business goals should not remain ambiguous paragraphs in design documents; they must translate into automated acceptance tests. Automated tests provide the only objective signal against which AI can iterate and self-correct.
2. Automated review as the first line of defense: Implement tiered automated gates to enforce code standards, allowing human engineers to focus on architectural decisions and business context.
3. Verification as foundational infrastructure: Automated test suites and sandbox environments are no longer secondary concerns; they are prerequisites for reliable agent execution.

Division of labor in this pipeline becomes straightforward: human engineers define intent, maintain architectural boundaries, and retain critical decision-making; AI tools handle implementation and drive test loops.

Compilers redefined the role of programmers, and CI/CD pipelines reshaped delivery topologies. The current transition follows the same pattern—an evolution traced in [From Copilot to Autonomous Agent]({{< ref "posts/2026-07-03-ai-coding-tools-future-copilot-to-agent" >}}). The priority now is implementing this architecture in day-to-day engineering practice.

## Unresolved Engineering Questions

Three open engineering challenges remain without clear consensus:

First, accurate measurement of team productivity. Measuring individual uplift via controlled trials proved extraordinarily difficult; measuring the net effect of AI adoption on team-level delivery quality and throughput remains unsupported by credible causal estimates.

Second, the operational cost of review false positives. Overly strict rules flood engineers with false alerts, causing alert fatigue. Overly lenient rules let subtle bugs slip into production. Maintaining a low-noise, high-precision automated review pipeline demands ongoing engineering effort.

Third, upstream bottleneck migration. As code implementation becomes virtually free, the delivery pipeline's constraint shifts upstream to requirement definition. If product teams cannot clearly define what to build and what to protect, faster code generation merely accelerates the accumulation of technical debt.

