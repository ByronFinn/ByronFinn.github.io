# Codex Keeps Reconnecting? Four Fixes


<!-- more -->

Codex talks to the ChatGPT backend over WebSocket by default. If your network path involves Clash, a corporate proxy, cross-border transit, or Cloudflare challenge pages, that long-lived WebSocket gets killed easily — and you end up staring at `Reconnecting... 1/5` over and over. Turn off WebSocket and switch to plain HTTP streaming requests, and the problem mostly disappears.

{{< image src="/pictures/posts/codex-websocket-reconnect-solutions.svg" caption="Comparison of the four fixes" width="900px" >}}

## Why WebSocket Breaks Behind Proxies

The WebSocket protocol starts with an HTTP Upgrade request; only after the server returns 101 does it switch to the long-lived connection. That long-lived connection is exactly where the problem sits — proxy servers, firewalls, and CDN nodes all run timeout policies on idle connections, and Cloudflare's challenge mechanism can inject an interstitial page mid-path. Any link in that chain kills the connection, and the Codex client starts `Reconnecting`.

{{< image src="/pictures/posts/codex-websocket-vs-http-flow.svg" caption="How WebSocket and HTTP streaming connections differ" width="800px" >}}

HTTP streaming (SSE / chunked responses) doesn't have this problem, because every request stands on its own — there's no persistent bidirectional channel to keep alive.

## Fix 1: A per-directory env proxy

The fastest to take effect. Create a `.env` file in the project directory:

```bash
all_proxy=http://127.0.0.1:7890
```

Replace `7890` with your proxy client's port. Codex reads this environment variable at startup, and all requests go through the proxy you specified.

**Pros**: works in 30 seconds, no config file changes.
**Cons**: only applies to the current directory; you have to set it up again for each project.

Good for quickly confirming whether a proxy is the culprit.

## Fix 2: Disable WebSocket in config.toml

Edit `~/.codex/config.toml` and add one line under the corresponding provider config:

```toml
[provider]
supports_websockets = false
```

This tells Codex not to attempt the WebSocket upgrade and to use HTTP streaming directly.

**Pros**: set it once and it applies globally; no per-launch flags.
**Cons**: the first token and mid-stream event updates may be a touch slower — hardly noticeable in practice.

This is the most recommended fix — the smallest change with stable results.

## Fix 3: Enable TUN mode in your proxy client

If your proxy client supports TUN (Clash Premium, mihomo, etc.), just turn TUN mode on:

```yaml
# clash config
tun:
  enable: true
  stack: system
```

TUN mode takes over all traffic at the system network layer, so Codex's requests go through the proxy automatically — no application-level configuration needed at all.

**Pros**: global transparent proxying; every app benefits, not just Codex.
**Cons**: requires admin rights, some proxy clients don't support it, and it can affect other networked apps.

For people already in the habit of running TUN.

## Fix 4: A custom HTTP provider

The most thorough fix: define a new provider that speaks pure HTTP. Edit `~/.codex/config.toml`:

```toml
model_provider = "chatgpt_http"

[model_providers.chatgpt_http]
name = "ChatGPT HTTP"
base_url = "https://chatgpt.com/backend-api/codex"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
```

This creates a `chatgpt_http` provider pointing at the ChatGPT backend API, using the Responses API protocol with WebSocket explicitly disabled.

**Pros**: avoids WebSocket entirely at the protocol level; model capabilities are completely unchanged (still gpt-5.5, still the Responses API).
**Cons**: it's a custom provider — if Codex later changes the ChatGPT backend paths or the provider field definitions, you may need to adjust along with them.

For when Fix 2 isn't enough, or when frequent disconnects are hurting your work.

## Which One to Pick

Your network is already stable — change nothing; keep WebSocket's real-time feel.

Occasional disconnects — Fix 2, `supports_websockets = false`; one line of config does it.

Constant Reconnecting — Fix 4 with a custom provider, or Fix 3 TUN mode; pick between the two based on what your proxy client can do.

Just experimenting — Fix 1 env proxy; 30 seconds to verify whether the proxy is the problem.

{{< admonition type=info title="About the experience difference" >}}
With WebSocket off, traffic takes the plain HTTP streaming path — the first token and mid-stream steering may be slightly less snappy than WebSocket, but in practice the difference is small. On a stable network, keeping WebSocket feels better; with frequent disconnects, the payoff from disabling it far outweighs the experience loss.
{{< /admonition >}}

## Related Posts

- {{< ref "posts/2026-05-17-codex-ssh-remote-guide.md" >}}: Codex SSH remote development setup

