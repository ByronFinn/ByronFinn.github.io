# The MCP Protocol: USB-C for AI Tool Interconnection


<!-- more -->


Before MCP, every AI tool integration was a **custom build**. Want ChatGPT to reach a database? Write a plugin. Want Claude to call the GitHub API? Write a Function Calling definition. Want Copilot to access your internal systems? Write a Custom Tool.

Every time, the same thing: define an interface, write adapter code, handle auth, manage errors. The wheel, reinvented countless times.

The problem MCP (Model Context Protocol) solves is simple: **give AI agents a standard protocol for connecting tools.** Just as USB-C gave electronic devices a universal connector, MCP gives AI agents a universal tool interface.

## What MCP Is

MCP is an open protocol defining the communication standard between AI agents (clients) and external tool services (servers). It specifies:

- How tools are described (name, parameters, return values)
- How tools are called (request format, response format)
- How errors are reported (error codes, error messages)
- How resources are shared (files, data, context)

A tool service implementing MCP can be called by any MCP client. Claude Code is one MCP client, Cursor is another, so is Claude Desktop. The same MCP server (say, a database query service) can serve multiple different AI agents — no per-agent integration code needed.

## JSON-RPC over stdio

MCP's transport-layer choice is worth chewing on: **JSON-RPC over stdio (standard input/output).**

Not HTTP, not gRPC, not WebSocket. stdio — the process's standard input and output streams.

This means an MCP server is a local process: the client launches it, sends JSON-RPC requests to its stdin, and reads responses from its stdout.

The choice looks "primitive", but it has several subtle benefits:

**Zero network configuration.** stdio is process-level — no ports, no firewall rules, no HTTPS certificates. It works the moment it starts.

**Inherently secure.** stdio communication happens only between local processes, never touching the network stack. No exposed ports means no attack surface. An MCP server needs no authentication — whoever can launch the process can use it. That's OS-level access control.

**Language-agnostic.** JSON-RPC doesn't care about languages. The server can be Python, the client TypeScript, and they speak JSON. Anything with JSON serialization and process management can implement MCP.

**Easy to debug.** You can pipe a request into an MCP server's stdin with `cat` or `echo` and watch the response on stdout with your own eyes. No curl, no Postman, no packet capture.

The cost is equally clear: **local only.** stdio doesn't do remote connections. If you want an AI agent to call a remote service, you need a local proxy process bridging the gap. MCP's `stdio` transport solves local tool integration; remote integration needs an additional transport implementation (such as HTTP SSE).

## Tool Discovery

MCP has an elegant tool-discovery mechanism. The client doesn't need to know in advance which tools a server offers — it discovers them on connection.

The flow:
1. The client launches the MCP server process
2. The client sends an `initialization` request
3. The server returns a capability declaration: supported tool list, resource list, protocol version
4. The client builds tool definitions from the capability declaration
5. The tool definitions are injected into the agent's system prompt

This means an MCP server can register new tools on its own and clients adapt automatically — no client release, no reconfiguration. Plug in a USB-C cable and the system recognizes the device — MCP tool discovery is the same logic.

## MCP Tools and Built-in Tools

Claude Code has built-in tools (read_file, write_file, bash...) and MCP tools (external services connected via the protocol). To the agent, there's no difference — both are "callable tools" with a name, a description, and parameters.

The difference is architectural:

- **Built-in tools** are hard-coded into the Claude Code process. They're the agent's "native abilities" — available at startup, no extra processes.
- **MCP tools** come from external processes. They're the agent's "extended abilities" — discovered on connect, gone on disconnect.

Built-in tools are like OS kernel modules; MCP tools are like peripherals. Kernel modules are stable but fixed; peripherals are flexible but pluggable.

## Configuration Simplicity

MCP's config file (`.claude/settings.json`) embodies its design philosophy — keep it simple:

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

No URL, no auth token, no port number. You only tell the client "how to launch this service" — a command and arguments. The client handles launching the process, establishing the stdio channel, and discovering tools.

This "command as config" model shares DNA with npm scripts and Makefiles. It assumes users already know their way around a command line and need no extra layer of abstraction.

## MCP's Ecosystem Significance

MCP's real value isn't the protocol itself; it's the **ecosystem effect**.

Once enough tools implement MCP, the capability boundary of AI agents expands exponentially. No agent needs to integrate every tool individually — implement once, use everywhere.

It's like browsers and HTTP. Before HTTP standardized, every network application had its own protocol. After standardization, any website could be reached by any browser. MCP may do the same for the AI agent ecosystem: any MCP tool usable by any MCP client.

## MCP's Limits

MCP isn't a silver bullet. It has clear boundaries:

**It solves tool connection, not data format.** MCP defines "how to call a tool" but not "what format the tool returns". Does a database query return JSON? An SQL result set? CSV? The tool decides.

**It doesn't solve permission management.** MCP assumes "whoever can launch the process may use the tool". Good enough for personal use, too coarse for team collaboration or multi-tenant scenarios.

**It doesn't solve version compatibility.** If an MCP server upgrades and changes tool definitions, clients may need to adapt. MCP has a protocol version number, but tool-level versioning has no mature answer yet.

## Further Reading: BYF's McpConnectionManager and /mcp-config

[BYF](https://github.com/ByronFinn/byf) has an innovation in MCP integration: **conversational configuration**.

Claude Code's MCP configuration means hand-editing JSON (`.claude/settings.json`). BYF offers a `/mcp-config` command that lets you add, edit, and authenticate MCP servers right in the conversation — no JSON surgery. Configuration changes are audited and rewritten automatically by the agent (carrying the Skill's governance rules), lowering MCP's adoption barrier.

BYF's `McpConnectionManager` runs the MCP server connection lifecycle: launch (stdio or HTTP/SSE), tool discovery (sorted by stability, built-ins first, MCP tools after), OAuth authentication, and automatic reconnection. BYF also sorts MCP transports into three kinds — stdio (local process), Streamable HTTP (the new generation of MCP transport), and legacy SSE (backward compatibility) — each with its own lifecycle management strategy.

One detail deserves mention: in its tool cache ordering (ADR 0011), BYF explicitly puts MCP tools last. The reason: MCP tools connect and disconnect, changing tool definitions — mix MCP tools in among stable built-ins, and one connection change invalidates the entire cache boundary. BYF solves this with stability ordering plus fixed sentinel markers. It's progressive disclosure at the caching layer: **unstable tools must not pollute the stable cache region.**

## Next Up

MCP lets agents connect external tools. But more tools doesn't mean better use — the agent needs to know when to plan before acting. Next up: **Plan Mode** — why does a "read-only planning" mode markedly improve code quality? And why is separating read, think, and write the key watershed in AI programming?

---

> This series analyzes the architecture of the [official Claude Code source](https://github.com/anthropics/claude-code), focusing on design ideas rather than code implementation.

