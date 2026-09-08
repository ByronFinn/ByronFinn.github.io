# A Complete Guide to LLMs: Tokens and Vectors in Depth


# AI Tutorial: A Guide to AI LLMs, from Basics to Depth

This article takes you deep into the core concepts of large language models — from basic principles to vector representation — building a complete knowledge system step by step.

---

## 1. Foundations of AI Application Development

### 1.1 Basic Principles and Concepts

#### In Plain Words

- **Core mechanism**: predict the next word from the previous one — like a word-chain game
- **How it works**: output is generated token by token

#### A Deeper Look

A large AI model involves two key stages:

| Stage        | Analogy  | What it does                                        |
| ------------ | -------- | --------------------------------------------------- |
| **Training** | Learning | Read massive amounts of data to build the model and stock its knowledge |
| **Inference** | Applying | Generate responses from input and deliver the service |

#### Core Technical Components

- **Transformer architecture**

  - Made of an encoder and a decoder
  - The core is the attention mechanism, which enables efficient information processing

- **Embedding and positional encoding**

  - Convert text into numeric vectors a computer can process
  - Add ordering information so the model understands sequence in language

- **Multi-head attention**
  - The core computational step
  - Decides which content matters more, which in turn shapes the output

---

## 2. Core Concepts

### 2.1 Basic Terms

- **AGI (Artificial General Intelligence)**: the end goal of large models — human-level intelligence
- **LLM (Large Language Model)**: short for large language model
- **Chat products vs LLMs**: the difference between the application layer and the model layer

### 2.2 How Models and Products Relate

| Analogy      | Concept       | Role                                            |
| ------------ | ------------- | ----------------------------------------------- |
| The brain    | LLM           | Powerful understanding and generation capacity  |
| App / product | Chat product | Makes the model easy and safe for ordinary people to use |

---

## 3. Tokens: The Smallest Unit of AI Language

### 3.1 What Is a Token?

> **A token = the smallest unit of text a model processes.**
> It is neither strictly a character nor a fixed word — it is a fragment cut out of the text by a compression scheme.

#### How tokens are split

- **English**: usually split into **word fragments**

  - `"I love apples"` → `["I", " love", " apple", "s"]`

- **Chinese**: usually split by **character or short word**

  - `"我喜欢苹果"` → `["我", "喜欢", "苹果"]`
  - _(the exact granularity depends on the tokenizer)_

- **Special tokens**: start/end markers, newlines, tool-call boundaries, and so on

> 💡 **Intuition**: tokens are like the particles of AI language — a model reads and generates **one token at a time**.

### 3.2 How Are Tokens Cut?

Most LLMs use algorithms such as **BPE/Unigram**:

- Find the most frequent character combinations in the text and assign each a vocabulary ID
- This way both single characters and common words or word fragments can be represented
- It balances **efficiency** (fewer tokens) against **generalization** (rare words can still be split apart)

> ⚠️ **Important**: the same sentence may produce a **different token count** under different models or vocabularies.

### 3.3 How Tokens Affect Products

| Factor            | How it shows up                                        | Optimization strategy                |
| ----------------- | ------------------------------------------------------ | ------------------------------------ |
| **Length limits** | A model can only read/hold a capped number of tokens per call | Truncate or retrieve in batches      |
| **Cost**          | Most commercial LLMs bill **by token count**            | Refine prompts, cut wasted tokens    |
| **Speed**         | Output streams out token by token                       | Control output length, reduce latency |
| **Quality**       | Sensible token control noticeably improves results       | Clean prompts, curate retrieved content |

#### 📊 Rules of Thumb for Token Estimation

- **English**: ~3-4 words ≈ 1 token (100 tokens ≈ 75 English words)
- **Chinese**: 1 character/word ≈ 0.6 tokens (varies by vocabulary)
- **Note**: for real counts, always defer to the specific model's tokenizer

---

## 4. Vectors: The Foundation of AI Understanding

### 4.1 What Is a Vector?

> In mathematics, a vector is a quantity with both **magnitude** and **direction** — or, more generally, an ordered list of numbers.

The simplest vector can be written as:

```plaintext
(2, 3)
```

This means:

- Move 2 units along the x axis
- Move 3 units along the y axis

It can represent the **position of a point** (an offset relative to the origin), or an **arrow starting at the origin (direction + length)**.

### 4.2 🧭 A Geometric Example

Imagine walking around on a plane:

- The vector **(2, 3)** means "walk right 2, walk up 3"
- The vector **(-1, 4)** means "walk left 1, walk up 4"

These numbers act like **coordinates**, telling you where to go in space.

📊 Draw it out:

- Origin at (0, 0)
- Endpoint at (2, 3)
  → the arrow pointing there is the "vector"

### 4.3 💡 Vectors as Features

When we apply this concept to AI, a vector is no longer just a position — it can represent features or meaning.

#### Example 1: color vectors

Suppose we describe a color's red, green, and blue components with 3 numbers:

```plaintext
Red:   (255, 0, 0)
Green: (0, 255, 0)
Blue:  (0, 0, 255)
```

This is a **3-dimensional vector space**. Every color is a 3-D point in that space, which lets us compute similarity between colors.

#### Example 2: human feature vectors

Suppose we want to describe a person with numbers:

| Feature | Meaning | Value |
| ---- | ---- | ---- |
| Age    | years | 25   |
| Height | cm   | 180  |
| Weight | kg   | 70   |

A person then becomes `(25, 180, 70)` — again a 3-dimensional vector. To compare how alike two people are, we compute the distance between their vectors.

For example:

```plaintext
A(25, 180, 70)
B(26, 178, 72)
```

Their vector distance is small → the two have similar features.

#### Example 3: semantic vectors for words

In natural language processing (NLP), models turn every word into a high-dimensional vector (say, 768 dimensions).

| Word  | Vector (excerpt)           |
| ----- | -------------------------- |
| king  | `[0.25, -0.12, 0.78, …]`   |
| queen | `[0.27, -0.10, 0.74, …]`   |
| man   | `[0.30, -0.15, 0.70, …]`   |
| woman | `[0.28, -0.13, 0.72, …]`   |

The model then discovers:

> `king - man + woman ≈ queen`

In other words, mathematical relations between vectors **can express semantic relations**. That is why we say:

> Vectors let machines understand meaning, not merely see text.

---

## 5. Token Management in the LLM Workflow

### 5.1 The End-to-End Workflow

Here is the main pipeline of a conversational Q&A application (with each step's relationship to tokens):

#### 1. User input

- **Raw text**: for example, "help me write a post-interview thank-you email"
- ✅ **Key point**: length is uncontrollable — clean up and cap it downstream

#### 2. Preprocessing (cleaning / structuring)

- Strip meaningless whitespace and normalize the text format
- Inject role/tone requirements (prompt templating)
- ✅ **Key point**: fewer dirty tokens — convey intent more clearly with fewer tokens

#### 3. Retrieval (optional: RAG)

- Vectorize the user's question → find relevant documents in a vector store → bring back several passages
- Splice those passages into the prompt as context
- ✅ **Key point**: retrieved passages must be **trimmed and summarized**, or you risk blowing the context window

#### 4. Assemble the final prompt (input sequence)

- **Composition**: `system instructions + tool/function definitions + retrieved evidence + conversation history + the current user question`
- Then the **tokenizer cuts all of it into tokens**
- ✅ **Key point**: count input tokens; when close to the limit:
  - keep the most relevant evidence first
  - **summarize / sliding-window** the history
  - cap generation (max_tokens)

#### 5. Model forward pass and the generation loop (decoding)

- The model reads the input tokens → outputs a **probability distribution over the next token**
- A sampling strategy (greedy/temperature/top-p…) picks the next token
- The new token is **appended to the context**, and the next one is predicted — round and round
- Until a **stop condition** is met: an end token appears / max_tokens is reached / a stop word is hit

- ✅ **Key point**:
  - **Output tokens** are produced as a stream
  - The more divergent the sampling (high `temperature`), the more tokens and the livelier the style may get
  - A sensible **`max_tokens`** controls cost and latency

#### 6. Detokenization

- The model outputs a token sequence that must be turned back into a text string
- ✅ **Key point**: seemingly trivial spaces and indentation are actually part of tokens

#### 7. Post-processing

- Structured extraction, formatting into Markdown/JSON
- Sensitive-information / compliance filtering
- Summarizing results or multi-round tool calls
- ✅ **Key point**: cutting **wasted output tokens** lowers cost and speeds things up

#### 8. Logging and billing

- Record input/output token counts, latency, failures, and retries
- Combine with quality metrics to iterate on prompts and retrieval strategy

> 🔄 **Flow diagram**:

{{< figure src="/pictures/note/2025-11-05-ai-001.svg" title="Concept map of AI LLM concepts (five layers)" caption="Layered relationships and key terms, from fundamental concepts and mathematical representation through model architecture and engineering or optimization, to agents and the future" class="center" >}}

### 5.2 🎯 Real-World Case Studies

#### Case 1: why long context does not mean high quality

- **Problem**: stuff all 20 pages of a document into the prompt, token count explodes → forced to truncate
- **Result**: the 2 most relevant passages get dropped
- **Fix**: **retrieval + passage scoring + summarization** — keep the **most critical information** with **fewer tokens**

#### Case 2: controlling cost and latency

- **Need**: the user only wants a bullet list — there is no reason to let the model write 1,000 tokens of prose
- **Strategy**: set `max_tokens=120` + prompt it with "answer in 6 bullets, each 20 words or fewer"
- **Effect**: cost and latency drop immediately, and the output matches the need

#### Case 3: how Chinese and English tokens differ in practice

- **Observation**: 100 Chinese characters and 100 English words usually produce **different token counts**
- **Advice**: at the product level, do rate limiting and budgeting based on **real token counts**

### 5.3 🛠️ Product and Engineering Playbook

#### Core strategies

1. **Count tokens in real time**: count once after assembling the prompt and before calling the model; near the limit, trigger a trimming strategy
2. **Layered context**: system instructions (short and stable) + highly relevant evidence (short and sharp) + recent dialogue turns (after summarization)
3. **Output caps and stop words**: configure `max_tokens` and stop words per scenario to keep answers from rambling
4. **Cap retrieved passage length**: set a maximum token count per passage and trim within sentences (keep only a few words around each hit)
5. **Metrics loop**: log `input_tokens/output_tokens/latency/success_rate` and A/B test prompts and retrieval strategies
6. **Multilingual scenarios**: token efficiency differs across languages; when necessary, do **language detection + translation into a single language** before the model sees the input

---

## 6. 🧠 Key Takeaways

### 6.1 Concepts at a Glance

| Concept        | In one sentence                                          |
| -------------- | -------------------------------------------------------- |
| **Token**      | The particles of AI language — all length, speed, and cost revolve around them |
| **Vector**     | Meaning in numeric form, letting machines grasp semantic relations |
| **Transformer**| The core architecture of modern AI, processing information through attention |

### 6.2 Recap

1. **Basic principle**: predict the next word, generate token by token
2. **Core architecture**: Transformer + attention mechanism
3. **Key concept**: vector representation lets machines understand semantics
4. **Real-world use**: the complete chain from model to product
5. **Token management**: the key to controlling length, cost, and quality

### 6.3 💡 Study Advice

- **Understand the token concept**: a crucial step into AI — tokens underpin how modern models process language
- **Practice token optimization**: in product development, good token management markedly improves results and lowers cost
- **Master vector representation**: understand how human language becomes math a machine can digest

> 🚀 **Next step**: if you'd like, I can draw you a diagram of the LLM workflow and its token interaction points, or write a small script that **counts tokens for a given text across different models** and estimates cost and latency.

---

## 📚 Further Reading

### 🔗 AI LLM Systematic Tutorials Series

1. **[This post] A Complete Guide to AI LLMs** — tokens and vectors explained in depth, from the ground up
2. **[Transformer Architecture Deep Dive]({{< ref "/posts/2025-11-05-transformer-attention-mechanism-deep-dive.md" >}})** — the attention mechanism and the core technology behind LLMs
3. **[Prompt Engineering Complete Guide]({{< ref "/posts/2025-11-05-prompt-engineering-context-management-complete-guide.md" >}})** — a hands-on guide from prompt engineering to context engineering
4. **[AI Technical Glossary]({{< ref "/posts/2025-11-05-ai-technical-glossary-complete-guide.md" >}})** — 270+ terms and a dictionary of the AI technology landscape

### 🎯 Suggested Learning Path

- **Beginners**: read this post first for the fundamentals, then use the glossary to consolidate terminology
- **Developers**: after this post, focus on the Prompt Engineering hands-on guide
- **Researchers**: go deep on the Transformer architecture to master the core principles of AI

