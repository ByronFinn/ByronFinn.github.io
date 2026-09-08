# Agent Interview Questions: Who Has Actually Done the Work


<!-- more -->

> **Attachment download**: [Agent Interview Questions.pdf](/files/agent-interview-questions.pdf) — handy for printing or offline reading

## Why Would You Need Multiple Agents

An opening question to separate people who have "read the articles" from people who have "actually built one".

**The bad answer:** "Multi-agent enables parallel processing, which improves system throughput and robustness."

Every word of that is correct, but if you follow up with "so after splitting into two agents, did throughput actually double?", they stall. The reality: inter-agent communication has overhead, coordination has complexity, and after the split total throughput may well drop. Adding agents is not like adding CPU cores.

**Good answers mention:**

- The basis for splitting is the **domain boundary**, not performance. A payments agent, an inventory agent, a user-behavior agent — each has its own data sources and failure boundaries
- If one agent can solve the problem, don't use two. After splitting, the consistency cost may exceed the benefit
- Candidates who proactively say "one agent is enough for our scenario" are more reliable than those who immediately draw a three-to-five agent architecture diagram

This question reveals whether someone has the **judgment to split or not to split**.

## How Do Agents Communicate With Each Other

The second question, probing whether they have done real integration work.

**The bad answer:** "Agents call each other via API, using gRPC or REST."

It sounds technical, but the heart of agent communication is **message design**.

**Good answers mention:**

- Asynchronous message queues are the default choice. Each agent has its own input pipeline, and messages carry timeouts and retries. Direct gRPC connections are rare in agent communication
- How the message structure is designed matters far more than which transport you use: what fields a message carries, how failed messages are handled, how ordering is guaranteed
- The logic for handling "an agent received a message that has nothing to do with it" says more about a candidate than "how do you send messages"

For reference, we discussed message design ideas in our earlier piece on multi-agent collaboration {{< ref "2026-05-19-multi-agent-collaboration-engineering.md" >}}, which covered several pitfalls we hit in practice.

## What Happens When an Agent Dies

This question has the most discriminating power, because only people who have actually run production think about it seriously.

**The bad answer:** "Add try-catch and a fallback."

Then if you ask what the fallback actually is, it falls apart.

**Good answers proactively distinguish two kinds of failure:**

1. **Expected failures**: API timeouts, the model returning the wrong format, tool call failures. These can be retried (with a limit), or routed down a pre-defined degradation path
2. **Systemic failures**: corrupted internal agent state, lost messages, deadlocks. These can't simply be retried; they require rolling back the whole chain or human intervention

Good answers also include concrete numbers:

- "API timeouts retry 3 times with exponential backoff"
- "Messages that fail 5 times in a row go to a dead-letter queue for manual handling"
- "Every state change is logged, so when something breaks we can trace it back"

They will also raise a key point: **agents must not retry indefinitely**. An agent without bounded limits can run far down the wrong path before anyone notices.

## How Do You Design Tool Calling

Function calling is a built-in model capability, but what you use in production is not the layer the model returns.

**The bad answer:** "Just define the JSON schema for the tools; the model picks on its own."

The model does pick, but production needs far more than that.

**Good answers mention:**

- Every tool needs a **complete schema description** — parameter names, types, enum values, required/optional — so the model can understand it accurately
- **Parameter validation** must be done again on the tool side; never trust the model's output. Models routinely hallucinate parameter values that aren't in the schema
- **Timeout control**: the model choosing a tool doesn't mean the tool will finish running. Every tool call must have a timeout
- **Result filtering**: tool output must not be fed straight back to the model. It needs a sanitization layer to strip sensitive information and truncate overly long content
- **Restrictions on tool selection**: not every tool is available to every agent. The callable tool set should be restricted based on role or context

When an agent does tool calling, context window management is a chronically underestimated problem. The input and output of every tool call consumes tokens; uncontrolled, a few tool calls can stuff the context full. Our practice is to define a tool-call budget for each agent — see the budget-management discussion in {{< ref "2025-11-05-prompt-engineering-context-management-complete-guide.md" >}}.

## How Do You Manage State and Memory

The last question, and the most easily underestimated one.

**The bad answer:** "Just pass the context to the agent; the model will remember the context on its own."

The model does "remember", but that kind of "remembering" is not the same thing as the state management real engineering needs.

**Good answers mention:**

- **Externalized state**: an agent's state must not live only in the model's context. After every key operation it should be persisted to Redis or a database
- **Persist one step at a time as each agent finishes** — saving only when everything finishes risks losing progress on a mid-run failure
- **State granularity**: what to store and what not to store needs design. Storing everything wastes space; storing only the conversation log loses information
- **Budget management for the context window**: a given model's context is finite, so as state grows it must be compressed, summarized, or paginated

{{< image src="/pictures/posts/agent-interview-assessment.svg" alt="Agent interview assessment matrix" caption="Five core interview dimensions: good answers versus memorized concepts" width="800px" >}}

## How to Judge Answer Quality

Each of the five questions above reveals a candidate's depth of real experience. A few overall signals:

**Things people who have actually done the work say:**
- "In our scenario at the time..."
- "We didn't consider that at first; we only added it after an incident"
- They can name version numbers, specific configuration values, and specific bugs they hit

**Things people who memorized concepts say:**
- Capability descriptions that all start with "can / will / could"
- When pressed for detail, they say "that depends on the implementation"
- They can give a rough answer to every question, but not a single one survives 3 layers of follow-up

The last signal may be the most valuable: **whether the candidate proactively says "I hadn't thought of that" or "we didn't handle that well back then".** People who have done the work know where their system's boundaries are; they don't pretend every problem is solved.

---

At the end of the day, an agent is a program with tool-use capability and autonomous decision logic. The interview tests whether someone has experience keeping a complex system stable. Someone who can articulate failure boundaries is far more useful than someone who can draw a perfect architecture diagram.

