# The Soul of an AI Coding Assistant: The Think-Act-Observe Loop


<!-- more -->


If you dig through the Claude Code source, you will discover a counterintuitive fact:

**The core of the entire program is a while loop.**

Not a complex state machine, not an elaborate pipeline, not distributed coordination — just a plain `while` loop that does three things over and over: let the model think, let the model act, feed the results back.

```
while (user hasn't quit) {
  thinking = callLLM(conversation history + tool definitions)
  if (thinking.wants to call a tool) {
    result = executeTool(thinking.toolCall)
    conversationHistory.push(result)
  } else {
    output(thinking.reply)
  }
}
```

That's it? The entire secret of an AI coding assistant lives in this loop?

Yes. And the secret isn't even new — it's called the **ReAct pattern** (Reason + Act), proposed back in 2022. But what stands between the ReAct paper and a product isn't an algorithmic breakthrough; it's **engineering judgment**: when to let the model think, when to let it act, and how to feed results back in so it keeps thinking.

## From Chatbot to Agent: One Loop Away

ChatGPT's model is simple: you say something, it replies. The model is **passive** — it waits for your question, then generates a block of text. That text might be code, an explanation, or a suggestion, but at its core it is **text**. Text doesn't change your file system, doesn't run commands, doesn't read the actual state of your project.

The first thing Claude Code does is turn this one-way channel into a **two-way closed loop**.

The model is no longer just a "responder" — it becomes an "operator". It can say "let me look at the project structure first" and actually go read the files; it can say "this test failed, let me run it" and actually execute the command; it can see the command output and make its next decision based on real results.

The key to this shift isn't a smarter model — it's the same model. The key is an added **action channel**, plus a **loop mechanism** that lets thinking and acting alternate.

## Think-Act-Observe: A Three-Step Breakdown

### Think

The first step of the loop is always thinking. The model takes in the current conversation history — the user's request, previous tool-call results, the project context injected into the system prompt — and makes a judgment:

- What information do I need right now? (→ call a tool)
- What conclusion can I draw right now? (→ reply to the user)
- Did my previous actions produce the expected results? (→ adjust strategy)

There is no technical barrier in this step. It's just an ordinary LLM call, except the prompt includes a set of **tool definitions** — the name, description, and parameter schema of every tool. Through natural-language comprehension, the model decides "which tool should I use right now".

### Act

If the model decides to call a tool, the loop enters the action phase. This is the most "tangible" part of the Claude Code source: what the model generates isn't text but a **structured tool-call request**.

```json
{
  "type": "tool_use",
  "name": "read_file",
  "input": { "path": "src/main.ts" }
}
```

Claude Code's agent module parses this request, finds the matching tool implementation, and executes it. The tool might read a file, write a file, run a shell command, search code... Each tool is an independent module with input validation, execution logic, permission controls, and output formatting.

The core design decision in this step: **tool calls are synchronous and blocking**. After the model issues a call, the loop pauses until the tool finishes and the result returns, and only then moves on. This isn't the optimal choice for performance (async parallelism is obviously faster), but it's the **clearest choice for cognition** — the model takes one action at a time, sees the result, then decides the next step, exactly the way humans program.

### Observe

After the tool finishes, its result is formatted as text and injected into the conversation history as a "tool response". Then the loop returns to the Think phase — the model has now seen the outcome of its action.

This is where the real magic is.

The model isn't "acting blind". It read the file and saw the actual contents; it ran the command and saw the real output; it changed the code, ran the tests, and saw the test results. Based on this **real-world feedback**, it adjusts its next move.

If a test fails, it reads the error and fixes the code. If the file structure differs from what it expected, it adapts to reality. If the command output reveals a new problem, it changes strategy.

**This act → observe → adjust closed loop is the essential difference between an AI coding assistant and a code-completion tool.** TabAutocomplete guesses what you'll type next; Claude Code understands the actual state of your project and makes decisions about it.

## The Loop's Termination Condition

A loop that can't stop is an infinite loop. What terminates the Think-Act-Observe loop?

In Claude Code, termination happens when the model decides **not to call any tool**. When the model judges "I have enough information to answer the user", what it generates is no longer a tool call but a natural-language reply. The reply is shown to the user, and the current turn ends.

The user sends another message, and the loop starts over.

There's a subtle design point here: within a single turn, the model may loop many times — read a file, edit a file, run tests, edit again — until it believes it's done, and only then sends the final reply. So the user sees not the process but the **result**. The process is folded inside the loop, hidden from the user.

## From ReAct to Production: Engineering Judgment

The loop in the ReAct paper and the loop in the Claude Code source look the same but are miles apart. The difference is engineering judgment:

**The context window is finite.** Every loop iteration burns tokens — tool-call requests, tool results, the model's thinking. Twenty rounds in, the context may be blown. Claude Code's solution is layered: message trimming, conversation compaction, context window management. None of this appears in the ReAct paper; it was forced out by production.

**Tool calls can fail.** The file doesn't exist, the command times out, permission is denied — these don't exist in the paper but are the norm in production. Every tool has error handling; error messages are formatted and injected into the conversation history so the model can "see" the failure and adjust on its own.

**The model can hallucinate.** It may call a nonexistent tool, pass wrong parameters, or force a tool call when none is needed. Claude Code has tool-name validation, parameter schema checking, and behavioral constraints in the system prompt.

**Users need control.** Not every tool call should just run — deleting files, pushing code, changing configs need confirmation. The permission system inserts a user-confirmation step into the Act phase: the loop pauses and waits for a human decision.

Add up this engineering judgment and an academic concept becomes a product you can use every day.

## Further Reading: BYF's TurnFlow — Another Implementation of the Same Loop

When I turned the same lens on my own open-source project, [BYF (Be Your Friend)](https://github.com/ByronFinn/byf), I found its Agent engine core is the same loop too — just with its own engineering trade-offs.

BYF wraps the Think-Act-Observe loop in a `TurnFlow` module that drives the stateless `loop/runTurn()`. The biggest difference from Claude Code: **BYF's `TurnFlow` holds no state across turns** — every loop iteration is independent, and state lives in the outer `Session` container (`ContextMemory._history`, `AgentRecords`, `Wire Records`).

This design decision shows up directly in BYF's architecture constraints: the `Agent` class must be usable standalone, and its constructor must not force a Session into existence. That means you can spin up an `Agent`, hand it a provider and a system prompt, and it runs — no dependency on a Session's lifecycle. This "thin Agent" design lets BYF's `/btw side query` (a side-channel query) reuse the same `Agent.generate()` for a read-only LLM call without disturbing the main loop's state.

BYF also handles the loop's **concurrency safety** with great care: while the main task is running a tool call, if the user wants to interject a quick question (`/btw`), the system grabs a snapshot via `ContextMemory.getStableSnapshot()` with any "dangling tool_call" stripped out, and runs the query against that snapshot. The result renders in a floating overlay — it never enters the history or the wire records. The main loop is never disturbed.

This is the same loop idea landing differently in different projects — the skeleton is identical, but the striations of the muscle differ.

## Why This Loop Matters So Much

The importance of the Think-Act-Observe loop isn't complexity — it's simple. Its importance lies in defining a **new interaction paradigm**:

In the old paradigm (Chatbot), AI is a **passive responder**. You say something, it answers. Its capability boundary is the length of a single generated text.

In the new paradigm (Agent), AI is an **active explorer**. It senses the world through tools, changes the world through actions, and adjusts strategy through observation. Its capability boundary is set by the number of tools and the depth of the loop.

That's why the same model is a chatbot inside ChatGPT and a coding assistant inside Claude Code. **The model didn't change — the loop the model runs in changed.**

## Next Up

The loop is the skeleton, but a skeleton doesn't do work on its own. Next up: the **tool system** — how 30-odd tools are organized, described, and dispatched, and why the quality of tool descriptions directly determines what the AI can and cannot do.

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

