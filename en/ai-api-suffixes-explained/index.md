# AI API Suffixes: What They Mean and Why They Exist


We often see URLs like these:

```plaintext
/v1/chat/completions
/v1/messages
/v1/responses
```

These suffixes are not decoration — they define a complete request and response data structure. Pick the wrong one and your code either errors out or silently loses data.

<!-- more -->

This article starts at `/v1/completions` and works its way to `/v1/responses`, explaining what each suffix stands for, why it was designed that way, and where the common pitfalls are.

---

## One URL Suffix Represents One Protocol

First, break down a typical API path:

```plaintext
https://api.openai.com/v1/chat/completions
        └────────────┬────────────┘
                 API Base URL
                         └─ /v1              API protocol version
                            └─ /chat         chat
                                  └─ /completions  generate a chat completion
```

`/v1` dictates the request fields, the response fields, the error format, the streaming event format, and the tool-call format. A single model may support several protocols at once, and a single protocol may be supported by different vendors — with varying degrees of compatibility.

So the real question is: **confirm which protocol your target platform supports first, then send requests and parse responses according to that protocol's spec.**

---

## `/v1/completions`: The Old Era of Text Continuation

Early LLMs did exactly one thing: given a piece of text, predict what comes after it.

```json
POST /v1/completions

{
  "model": "gpt-3",
  "prompt": "Translate this sentence into Chinese: Hello, how are you?"
}
```

The model had no idea what a system message, a user input, or an assistant reply was. If you wanted a conversation, you stitched it yourself:

```plaintext
System: You are a helpful assistant.
User: Hello.
Assistant: Hi, how can I help?
User: Explain API suffixes.
Assistant:
```

This has two problems. First, the model has to guess from the text formatting who said what, which hands prompt injection more openings. Second, conversation history can't be structured — all context lives in one giant string. Tool calls or image input simply can't be handled gracefully.

Today this endpoint is basically a legacy artifact. The official OpenAI docs mark it as Legacy.

---

## `/v1/chat/completions`: The Most Important Protocol of the Past Few Years

This is the LLM API with the best compatibility today. Nearly every major vendor supports it or is compatible with it.

```json
POST /v1/chat/completions

{
  "model": "gpt-5.5",
  "messages": [
    {
      "role": "system",
      "content": "You are a concise technical explainer."
    },
    {
      "role": "user",
      "content": "Explain what /v1/chat/completions means."
    }
  ]
}
```

### messages Is the Core

Every object in the `messages` array has a `role` and `content`:

- `system`: system instructions, defining the boundaries of model behavior
- `user`: user input
- `assistant`: the model's previous replies
- `tool`: tool call results

This is far smarter than hand-stitching `User:` and `Assistant:` lines. Context goes from a single string to an ordered set of message objects with roles.

### Compatibility Comes in Layers

"OpenAI API compatible" gets thrown around as marketing, but compatibility has levels:

```plaintext
Level 1: plain text chat (model + messages + choices)
Level 2: streaming output (stream: true)
Level 3: tool calling (tools + tool_calls)
Level 4: structured output (response_format + JSON schema)
Level 5: multimodal input (vision / audio)
Level 6: complex agent event streams
```

Most platforms claiming OpenAI compatibility only reach Level 2 or Level 3. Before switching platforms, test whether the features you need actually work.

### Why the Ecosystem Is So Good

Because the infrastructure is already built. SDKs, proxies, gateways, frontend chat apps, and RAG frameworks all speak the OpenAI Chat Completions protocol. Switching platforms usually means changing three things:

```python
client = OpenAI(
    api_key="OTHER_PROVIDER_API_KEY",  # change the key
    base_url="https://api.other.com/v1"  # change the base URL
)

response = client.chat.completions.create(
    model="other-model",  # change the model name
    messages=[{"role": "user", "content": "Hello"}]
)
```

But "it runs" and "fully compatible" are two different things.

---

## `/v1/messages`: Claude's Messages Protocol

Anthropic took a different path.

```json
POST /v1/messages

{
  "model": "claude-sonnet-4-8",
  "max_tokens": 1024,
  "system": "You are a careful technical explainer.",
  "messages": [
    {
      "role": "user",
      "content": "Explain /v1/messages."
    }
  ]
}
```

The differences from OpenAI come down to three things.

### system Is a Top-Level Parameter

OpenAI puts `system` inside the `messages` array, mixed in with everything else. Claude lifts it out as a top-level field. Looks like a small thing, but the parsing logic is completely different.

### content Is a Block Structure

Claude's content can be a string, or content blocks — text, images, and tool call results are all different types of blocks.

The response parsing path differs too:

```plaintext
OpenAI:    response.choices[0].message.content
Claude:    response.content[0].text
```

Field names like `stop_reason`, `usage.input_tokens`, and `usage.output_tokens` differ as well.

### They Cannot Be Mixed

OpenAI's and Claude's interface structures are incompatible — one cannot directly replace the other. You need an adapter layer to convert. Many third-party platforms claim to support the Claude protocol, but actually just wrap an OpenAI-compatible layer; Claude-specific features (like extended thinking) may not work.

---

## `/v1/responses`: A Unified Response Object

The Responses API OpenAI launched in 2025 is a redesign of Chat Completions.

```json
POST /v1/responses

{
  "model": "gpt-5.5",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Search the web and summarize the result."
        }
      ]
    }
  ],
  "tools": [
    {
      "type": "web_search"
    }
  ]
}
```

### Why a New Protocol

The name `/v1/chat/completions` carries two pieces of historical baggage: `chat` and `completions`. The original design assumption was that the user supplies a chat history and the model completes the next message.

But models don't just chat anymore. They read images, process audio, read files, search the web, call functions, use a code interpreter, maintain server-side context, output structured JSON, and return reasoning summaries. Cramming all of that into a `chat.completion` object gets more and more awkward.

The Responses API's design idea: the input is a task, its context, and the available tools; the output is a complete response object containing text, tool calls, and intermediate results.

```plaintext
Chat Completions:
  Input:  a messages array
  Output: a single assistant message

Responses:
  Input:  input / items
  Output: a response object containing multiple output items
```

### New Projects Should Watch It

If you're just doing simple chat, `/v1/chat/completions` still works and has the best ecosystem compatibility.

But once tool calling, web search, file search, the code interpreter, multimodal input, complex streaming events, server-side state, or agent workflows are involved, the Responses API is the better fit.

---

## Google Gemini: RESTful Resource Style

Gemini's paths look like this:

```plaintext
POST /v1/models/{model}:generateContent
POST /v1beta/models/{model}:generateContent
```

Broken down:

- `/v1` or `/v1beta`: the API version
- `/models/{model}`: the model resource
- `:generateContent`: the method executed against that resource

This is the standard Google API style — perform an operation on a resource. Clearly different from the naming style of OpenAI and Anthropic.

The data structure differs too. Gemini uses `contents` + `parts` instead of `messages`:

```plaintext
OpenAI:     messages -> role + content
Anthropic:  messages -> role + content blocks
Gemini:     contents -> role + parts
```

`v1` is the stable version; `v1beta` carries preview capabilities. Use `v1` in production; consider `v1beta` only if you want the cutting edge.

---

## `/v1/embeddings`: The Vectorization Endpoint

This endpoint turns text into a vector of floating-point numbers:

```json
POST /v1/embeddings

{
  "model": "text-embedding-3-large",
  "input": "AI API suffixes explained"
}
```

Returns:

```json
{
  "data": [
    {
      "embedding": [0.0123, -0.0456, 0.0789]
    }
  ]
}
```

The typical use is RAG: use `/v1/embeddings` to convert document chunks into vectors stored in a database; when the user asks a question, convert the question into a vector too, retrieve the most similar document chunks, then feed them into a chat endpoint to generate the answer. To build a RAG system from scratch, see {{< ref "posts/2025-11-06-rag-system-complete-guide-langchain-ollama-pgvector.md" >}}.

The embedding endpoint finds the material; the chat endpoint writes the answer. Two endpoints, two jobs.

---

## `/v1/models`: The Model List

```plaintext
GET /v1/models
GET /v1/models/{model}
```

Query which models your account can access, check that a model name is correct, or render a dynamic model picker. It's also what you reach for when debugging a `404 model_not_found` error.

---

## Why `/v1` Has to Exist

Many people assume `/v1` means first-generation model and `/v2` second-generation. Wrong.

`/v1` is the API version, not the model version.

```plaintext
API version constrains: request fields, response fields, error format, streaming events, tool-call format, auth method
Model version constrains: model capability, size, context length, reasoning ability, price, speed
SDK version constrains: changes to the client library's interface
Protocol style constrains: OpenAI-compatible / Anthropic-compatible / Gemini-compatible
```

These four are not the same thing.

API versions exist for backward compatibility. If a vendor changed the response structure, old code would break. So the usual move is to open a new version (`/v2`) or add a new endpoint set (`/v1/responses`) rather than make breaking changes within the same version.

---

## The Difference Between Base URL and Endpoint

A lot of software asks whether you're filling in a Base URL or an Endpoint. They are not the same:

```plaintext
Base URL: up to and including /v1
  https://api.openai.com/v1
  https://api.groq.com/openai/v1
  https://openrouter.ai/api/v1

Endpoint: the full path
  https://api.openai.com/v1/chat/completions
```

If the software asks for a Base URL, don't include `/chat/completions` — the SDK appends it automatically. Get it wrong and the actual request may become:

```plaintext
https://api.openai.com/v1/chat/completions/chat/completions
```

Followed by a 404.

Rules of thumb:

- **Base URL / API Base / OpenAI Base URL**: fill up to `/v1`
- **Endpoint / Full URL / Request URL**: fill the full path
- **Provider**: choose the protocol type (OpenAI, Anthropic, Gemini)
- **Model**: fill the model ID, not a URL

---

## Different Response Structures Mean Parsing Code Cannot Be Mixed

This is the easiest place to stumble. All four protocols have different response structures:

```python
# OpenAI Chat Completions
text = response.choices[0].message.content

# Anthropic Messages
text = response.content[0].text

# OpenAI Responses
text = response.output_text

# Gemini
text = response.candidates[0].content.parts[0].text
```

Get it wrong and you either get an error or an empty value. When switching platforms, response parsing logic must change with it.

Streaming output formats differ too. OpenAI uses `data: {"choices":[{"delta":{"content":"Hel"}}]}`; Anthropic uses an event-stream format like `event: content_block_delta`. The same `stream: true` parameter hides completely different implementations.

---

## Protocol Cheat Sheet for Major Vendors

| Vendor | Endpoint path | Protocol style | Primary use |
|------|----------|----------|----------|
| OpenAI | `/v1/responses` | New OpenAI generation | Multimodal, tools, agents; first choice for new projects |
| OpenAI | `/v1/chat/completions` | Chat Completions | Traditional chat, ecosystem compatibility |
| Anthropic | `/v1/messages` | Native Anthropic | Claude conversations, tools, multimodal |
| Google | `/v1/models/{model}:generateContent` | Google REST style | Gemini stable endpoint |
| Mistral | `/v1/chat/completions` | OpenAI-like | Chat, tool calling |
| xAI | `/v1/chat/completions` | OpenAI-like | Grok conversations |
| DeepSeek | `/chat/completions` | OpenAI-like | DeepSeek chat models |
| Groq | `/openai/v1/chat/completions` | OpenAI-compatible | High-speed inference |
| OpenRouter | `/api/v1/chat/completions` | OpenAI-compatible | Multi-model aggregation and routing |

---

## How to Choose

- **Simple chat**: `/v1/chat/completions` — the most mature ecosystem
- **New project on OpenAI needing modern capabilities**: `/v1/responses`
- **Official Claude integration**: `/v1/messages` — don't force an OpenAI shell over it
- **Gemini integration**: `/v1/models/{model}:generateContent`
- **Building RAG**: `/v1/embeddings` + any chat endpoint
- **Third-party aggregation services**: confirm which protocol they're compatible with first, then pick an SDK. To build your own API proxy, see {{< ref "posts/2026-05-16-self-hosted-ai-api-pipeline.md" >}}.

---

## One Diagram to Sum It Up

{{< image src="/pictures/posts/ai-api-suffixes-protocol-evolution.svg" alt="Evolution path of AI API protocols" caption="From /v1/completions to /v1/responses: protocols evolved from text continuation to a unified response object" >}}

{{< image src="/pictures/posts/ai-api-suffixes-request-structure.svg" alt="Request structure comparison of the four major protocols" caption="Request structure differences among OpenAI Chat, Anthropic Messages, OpenAI Responses, and Gemini generateContent" >}}

Protocol incompatibility is the norm; compatibility is the exception. Pick the right protocol, fill in the right Base URL, parse the right response structure — get these three right and there are few pitfalls left in calling AI APIs.

