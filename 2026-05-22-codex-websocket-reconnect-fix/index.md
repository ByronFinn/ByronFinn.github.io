# Codex 一直 Reconnecting，四种解法


<!-- more -->

Codex 默认走 WebSocket 跟 ChatGPT backend 通信。如果你的网络中间有 Clash、公司代理、跨境线路或者 Cloudflare 的 challenge 页，WebSocket 长连接很容易被打断，然后你就会反复看到 `Reconnecting... 1/5`。关掉 WebSocket，改走普通 HTTP 流式请求，这个问题基本消失。

{{< image src="/pictures/posts/codex-websocket-reconnect-solutions.svg" caption="四种方案对比" width="900px" >}}

## 为什么 WebSocket 在代理环境下容易断

WebSocket 协议需要先发一个 HTTP Upgrade 请求，服务端返回 101 之后才切换到长连接。问题出在这个长连接上——代理服务器、防火墙、CDN 节点都对空闲长连接有超时策略，Cloudflare 的 challenge 机制也可能在中间插入拦截页面。任何一环把连接掐了，Codex 客户端就开始 `Reconnecting`。

{{< image src="/pictures/posts/codex-websocket-vs-http-flow.svg" caption="WebSocket 和 HTTP 流式的连接差异" width="800px" >}}

HTTP 流式（SSE / chunked response）不存在这个问题，因为每次请求是独立的，不需要维持一条持续的双向通道。

## 方案一：目录级 env 代理

最快见效的方式。在项目目录下创建 `.env` 文件：

```bash
all_proxy=http://127.0.0.1:7890
```

把 `7890` 换成你代理客户端的端口。Codex 启动时会读取这个环境变量，所有请求走你指定的代理。

**优点**：30 秒见效，不需要改配置文件。
**缺点**：只对当前目录生效，换项目要重新配。

适合临时验证是不是代理导致的问题。

## 方案二：config.toml 关掉 WebSocket

编辑 `~/.codex/config.toml`，在对应的 provider 配置下加一行：

```toml
[provider]
supports_websockets = false
```

这个配置告诉 Codex 不要尝试 WebSocket 升级，直接用 HTTP 流式。

**优点**：配置一次全局生效，不用每次启动带参数。
**缺点**：首 token 和中途事件更新可能略慢一点点，体感差异不大。

这是最推荐的方案，改动最小，效果稳定。

## 方案三：代理客户端开 TUN 模式

如果你的代理客户端支持 TUN（Clash Premium、mihomo 等），直接开 TUN 模式：

```yaml
# clash config
tun:
  enable: true
  stack: system
```

TUN 模式在系统网络层接管所有流量，Codex 的请求会自动走代理，不需要任何应用层配置。

**优点**：全局透明代理，所有应用都受益，不只是 Codex。
**缺点**：需要管理员权限，部分代理客户端不支持，可能影响其他网络应用。

适合已经有 TUN 使用习惯的人。

## 方案四：自定义 HTTP Provider

最彻底的方案，直接定义一个新的 provider 走纯 HTTP。编辑 `~/.codex/config.toml`：

```toml
model_provider = "chatgpt_http"

[model_providers.chatgpt_http]
name = "ChatGPT HTTP"
base_url = "https://chatgpt.com/backend-api/codex"
wire_api = "responses"
requires_openai_auth = true
supports_websockets = false
```

这个配置创建了一个 `chatgpt_http` provider，指向 ChatGPT 的 backend API，使用 Responses API 协议，显式关闭 WebSocket。

**优点**：从协议层面彻底避开 WebSocket，模型能力完全不变（还是 gpt-5.5，还是 Responses API）。
**缺点**：这是自定义 provider，如果 Codex 后续改了 ChatGPT backend 的路径或 provider 字段定义，可能需要跟着调整。

适合方案二不够用、或者经常断连影响工作的场景。

## 怎么选

网络本来很稳——不用改，保留 WebSocket 的实时体验。

偶尔断连——方案二，`supports_websockets = false`，一行配置搞定。

经常 Reconnecting——方案四自定义 provider，或者方案三 TUN 模式，二选一看你的代理客户端能力。

只想试试——方案一 env 代理，30 秒验证问题是不是代理导致的。

{{< admonition type=info title="关于体验差异" >}}
关掉 WebSocket 后走的是普通 HTTP 流式路径，首 token 和中途 steering 的实时性可能略逊于 WebSocket，但实际体感差异很小。如果网络稳定，保留 WebSocket 体验更好；如果经常断连，关掉的收益远大于体验损失。
{{< /admonition >}}

## 相关文章

- {{< ref "posts/2026-05-17-codex-ssh-remote-guide.md" >}}：Codex SSH 远程开发配置

