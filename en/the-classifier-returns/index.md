# The Classifier Is the Savior Again


In any enterprise tech team that claims to be “fully AI-powered,” the bill nobody wants to look at closely is usually not production inference — it’s the **evaluation pipelines** we run to deceive ourselves.

<!-- more -->

Over the past three years, the biggest, most sacred, and least defensible totem in the enterprise stack has been the “private enterprise knowledge base” — first repackaged as RAG, then upgraded again as GraphRAG with a knowledge-graph label. Every architect, when drawing the final architecture diagram for the CTO, dutifully adds the last box: “Closed-loop evaluation and continuous alignment.”

And at that final box, the industry has reached an almost pathological consensus: **LLM-as-a-Judge**.

The logic sounds airtight: user questions are messy natural language, retrieved chunks are fragmented context, and generated answers are unpredictable text. You can't write traditional unit tests — there's nothing to assert. So everyone settles on the most expensive solution: point GPT-5 or Claude Sonnet at the question, the retrieved chunks, the answer, and the semi-structured triples dug out of the Neo4j topology, stuff them all into the context, and attach a boilerplate prompt: “Act as an extremely rigorous chief auditor. Reason step by step and evaluate the accuracy of the following answer, and output a final JSON score…”

Then the whole industry waits patiently for 600 tokens of boilerplate prose, hoping the regex at the end doesn't blow up because of a stray newline.

Recently, Daniel Shea and Seán Roche from LangChain published a benchmark (Jev-as-a-Judge for Agent Evals) and, in remarkably restrained language, poured cold water on this charade ([source tweet](https://x.com/LangChain/status/1870634284704099080)). They tested **Jev**, a model just released by TypeSafe AI. For anyone who has ever cleaned up a production eval mess, the subtext of the post reads like one joke with two punchlines: exhaustion and bitter laughter.

**We burned billions of dollars in token taxes marching through self-regression mazes — and the “breakthrough” that makes the industry gasp turns out to be a classifier that finally shuts up, stops writing essays, and just emits a structured boolean.**

## 1. The Quality Inspector Costs 25x What the Assembly Line Does

Before unpacking Jev, let's first look at the financial black hole at the RAG/GraphRAG site.

The original promise of RAG was to put a leash on the LLM's stream of confidence and use enterprise private data as factual grounding. But at the evaluation stage, things take a turn toward the surreal:

Say you've built an enterprise knowledge base, and a user asks: "For 2026, what is the payout policy for restricted-stock on the east China region?"

1. The vector database recalls 5 document chunks;
2. GraphRAG traverses 3 levels of community summaries to assemble a neat topology web;
3. The production model generates a 200-character answer.

This production run costs approximately **$0.002**.

The real party begins now. To prove the system is "reliable" on a dashboard, the evaluation pipeline gets triggered and produces three classic scores:

- **Faithfulness/Groundedness**: is the answer actually grounded in the retrieved documents?
- **Context Relevance**: are the retrieved chunks and graph summaries actually relevant?
- **Entity Consistency**: did the graph expansion swap any nodes?

To compute these three numbers, you have to take all of the above context — typically 8K to 16K tokens — pack it up again, and call the LLM API three times.

The judge is thorough. It doesn't just score — it also writes a delightful essay: “First, paragraph 3 of the reference document states the baseline; the candidate answer correctly converts the currency in sentence 2. However, in the East Coast constraint case... Overall, score: 4.”

After this entire shopping trip: **$0.05**, plus 4s of P99 latency.

**Your quality inspection costs 25x the cost of production.**

Trust in the metric decays too: the LLM judge is itself decoding probability. In a real production incident you'd see consistent playback: RAG retrieved the correct clause, the model answered correctly — but the judge model, relying on its own prior memorization from the era of its pretraining, would elaborate a 300-word essay arguing "although the evidence says so, in the usual business convention…", then deduct two points.

You've paid a drunk philosopher to check a sober intern's arithmetic.

The result: most teams quietly turn off full evaluation after the first month, switch to 1% sampling, and finally sink to 50 golden cases before release, as a ritual. Has the production system crashed? If no one in the group chat has @-mentioned the entire group, it hasn't crashed.

## 2. An Execution With Only Five Samples

It was at this point — when the whole industry was running out of good synonyms for "eval" — that the LangChain benchmark appeared.

The design carries the black humor of programmers who have seen everything: they built a weather-checking Agent with the Deep Agents framework, prepared **exactly 5 test cases**. To make the number not look like a joke, they loop the 5 fixed runs 100 times, produce 500 judge calls, and recruit one human annotator as the Oracle.

The defendants:

| Evaluator | Binary accuracy (agree w/ human) | Score variance (lower=better) | Cost per call |
| --- | --- | --- | --- |
| **Jev** | **100.0%** | **0.0000149 (baseline)** | **$0.00035 (0.44s)** |
| GPT-5.6 Terra | 99.8% | 913x baseline | undisclosed (high) |
| GPT-5.6 Luna | 96.4% | 433x baseline | undisclosed (mid) |
| Claude Sonnet 4.6 | 80.0% | 92x baseline | $0.05634 (very slow) |

The results leave the current paradigm exposed:

**1. The aristocrats lose it.** The most expensive, most carefully prompt-engineered judge — Claude — only scores 80%, meaning one out of every five of its decisions contradicts the human oracle. And the variance is brutal: feeding identical inputs, the best mainstream LLMs vary their continuous score by up to a factor of ~1000 compared with Jev. Now think about inserting a metric with that much variance into your CI/CD pipeline — you're not testing the system; you're testing the state of the local random number generator that day.

**2. The industrial bill gap.** For 500 calls: Claude Sonnet 4.6 = **$28.17**; Jev = 0.44s average per call, $0.00035 per call → **$0.34 for the whole experiment**. 

Eighty-plus times cheaper overall. So “we can check every answer” finally becomes a real option, not just a decorative dashboard line.

## 3. Under the Hood: The Savior Is… a 2020 Classifier?

So what's the real trick behind this downgrade (in a good way)?

The public specification from TypeSafe AI:

- **Choice**: pick one answer from given options (prob over options);
- **Score**: give a continuous score 0.0–1.0 with confidence;
- **Noul**: a "does this retrieval solve the question" yes/no typed probability.

{{< image src="/pictures/posts/classifier-returns-internal.svg" caption="Jev's internals: encode context and answer, then a classification head emits a typed result (bool / score / Noul)" width="800" class="center" >}}

You take the inputs — context, trace, answer — encode them, run them through a transformer, and instead of an autoregressive decoder you bolt on a linear layer plus softmax. That is exactly the trick BERT, RoBERTa and the cross-encoders used. You don't need a Llama to be a judge — you need a well-calibrated classifier.

In the pre-2020 NLP world, this was the standard way to check whether an answer was based on retrieved documents: take a few hundred MB of DeBERTa-v3, run NLI, treat the doc as the premise and the generation as the hypothesis, and get a deterministic entailment probability in 15 ms on a CPU.

Then the generative wave hit, and the industry had a mass amnesia. We threw away typed interfaces and deterministic tensor paths, and forced the whole internet into the `generate_text()` black box, teaching the LLM sonnets, *"yes! I'm happy to help"*, and then paying thousands of prompt engineers to write picture-perfect prompts just to coax a syntactically valid JSON out of it.

We spent five years grinding the wheel from a square into a polygon, then proudly announced that we had discovered the circle.

## 4. The Takeaway: Evaluation's Center of Gravity Shifts Back

Maybe the most important thing about Jev is not that “it is new”, but that it restores evaluation cost to a scale where doing it everywhere is engineering-incentive-compatible:

- Evaluations can now run in full — every evaluation, not once a month;
- Their outputs are typed and deterministic (boolean / score / probability), so they can be linked into gate passes, not just "review by feel";
- And they are cheap to the point of being a rounding error in the overall budget.

The specific advice for teams reading this:

- First, implement grayscale and eval gates driven by Jev or other deterministic classifiers: binary judgments get boolean scoring, "groundedness" stays a well-supervised judgment;
- For those rare still-truly-subjective evals, we still have a human in the loop or, in limited cases, a bigger LLM, but now it is selective rather than structural.

The future memory of this experiment won't be “Jev won 5 samples”; it will be: evaluator cost (in dollars and in variance) is no longer a reason to skip the evaluation loop. The era of the hand-rolled eval pipeline that only runs before releases is over.

The classifier is the savior again — this time, for real.

## Further Reading

- [Building a RAG System Step by Step (LangChain + Ollama + pgvector)]({{< ref "/posts/2025-11-06-rag-system-complete-guide-langchain-ollama-pgvector.md" >}})
- [The Technical Core of Multi-Agent Collaboration]({{< ref "/posts/2026-08-12-multi-agent-technical-core.md" >}})
- [LLMs 101: Tokens, Vectors, and the Transformer]({{< ref "/posts/2025-11-05-ai-llm-tutorial-token-vector-basics.md" >}})

