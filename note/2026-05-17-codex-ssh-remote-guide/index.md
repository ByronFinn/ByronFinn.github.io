# Codex App SSH 远程开发配置指南


<!-- more -->

> **更新说明**：本文基于 2026 年 5 月的 Codex App 版本撰写。SSH Remote 功能目前仍处于 alpha 阶段，配置方式和界面入口可能随版本更新发生变化。如果发现内容已过期，请参考[官方文档](https://github.com/openai/codex)获取最新信息。

Codex App 已经支持通过 SSH 连接远程机器，目前该功能处于 alpha 阶段。

对于需要在远程服务器上开发、训练模型、运行环境的人来说，这是一个值得尝试的功能。它能让你直接在 Codex 里连接远程服务器，在远程文件系统和 shell 中工作，不再需要在本地终端、VSCode Remote、SSH、tmux 之间来回切换。

## 一、这个功能适合谁？

以下场景可以重点关注：

- 本地写代码，服务器跑模型，需要连实验室或公司 GPU 服务器
- 后端项目依赖远程部署环境（代码、依赖、数据库、服务都在远程 devbox 上）
- 平时大量使用 `ssh + tmux + vim` 或 VSCode Remote-SSH
- 需要在多台机器之间切换开发环境

以往这类工作流通常是：

```bash
ssh devbox
cd project
tmux attach
# 然后手动编辑、运行脚本
```

现在 Codex 开始将"远程开发环境"作为一等公民接入进来。

{{< image src="/pictures/note/codex-ssh-remote-arch.svg" caption="本地 → 远程 SSH 连接架构" width="800px" >}}

## 二、开启 SSH Remote 功能

{{< image src="/pictures/note/codex-ssh-remote-steps.svg" caption="三步核心配置流程" width="900px" >}}

目前该功能仍在 alpha 阶段，需要手动开启 feature flag。

编辑本地 Codex 配置文件 `~/.codex/config.toml`，加入以下配置：

```toml
[features]
remote_control = true
remote_connections = true
```

保存后重启 Codex App。

{{< admonition type=warning title="Alpha 功能提醒" >}}
该功能目前处于 alpha 阶段，后续配置项、入口位置、稳定性都可能发生变化。建议在非生产环境中先行测试。
{{< /admonition >}}

## 三、配置 SSH Host

官方推荐先将远程机器写入本地 SSH config，这样 Codex 可以自动发现已配置的 SSH Host。

编辑 `~/.ssh/config`：

```ssh-config
Host devbox
  HostName your_server_ip_or_domain
  User your_username
  Port 22
  IdentityFile ~/.ssh/id_ed25519
```

配置完成后，先在本地终端验证连通性：

```bash
ssh devbox
```

如果这里连不上，Codex 里大概率也连不上。请先排查：

- 网络是否可达（`ping` 或 `telnet` 测试端口）
- 密钥是否正确（`ssh -v devbox` 查看详细日志）
- 用户名和端口是否匹配

## 四、远程机器环境准备

Codex App 连接远程项目时，会通过 SSH 在远程机器上启动 Codex app server。因此远程机器上需要满足以下条件：

1. **已安装 Codex** —— 远程端也需要安装 Codex CLI
2. **已完成认证** —— 远程端需要登录并授权
3. **PATH 可用** —— `codex` 命令在远程登录 shell 的 PATH 中可访问

SSH 到远程机器后进行检查：

```bash
which codex
codex --version
```

如果 `which codex` 没有输出，说明远程 shell 找不到 Codex。常见原因和解决方法：

| 问题 | 解决方法 |
|------|----------|
| Codex 未安装 | 参考[官方安装文档](https://github.com/openai/codex)进行安装 |
| 安装了但 PATH 找不到 | 检查 `~/.bashrc` / `~/.zshrc` / `~/.profile` 中是否正确添加了 PATH，注意 SSH non-interactive shell 可能不会加载所有配置文件 |
| 权限问题 | 确认 Codex 二进制文件有执行权限（`chmod +x`） |

{{< admonition type=info title="关于 SSH shell 环境" >}}
SSH non-interactive login（即 Codex 连远程的方式）通常只加载 `~/.bash_profile` 或 `~/.profile`，**不会**加载 `~/.bashrc`。如果你的 PATH 配置写在 `~/.bashrc` 里，可能需要在 `~/.bash_profile` 中加入 `source ~/.bashrc`，或者直接将 PATH 写到 `~/.profile` 中。
{{< /admonition >}}

## 五、在 Codex App 中添加远程项目

重启 Codex App 后，按以下步骤操作：

1. 打开 Codex App
2. 进入 **Settings**
3. 找到 **Connections**（连接管理）
4. 添加或启用已配置的 SSH Host
5. 选择远程机器上的项目目录
6. 创建或打开远程项目线程

完成配置后，Codex 的读文件、写文件、运行命令等操作都会直接在远程机器上执行。它不是简单地"查看远程代码"，而是在远程环境中完整工作。

## 六、常见问题排查

### 连接超时或失败

```bash
# 在本地终端逐步排查
ssh -v devbox              # 查看 SSH 连接详细日志
ssh devbox "which codex"   # 确认远程 PATH 是否正常
ssh devbox "codex --version"  # 确认远程 Codex 可用
```

### 远程 Codex 版本不兼容

Codex 的本地客户端和远程 server 端版本需要匹配。如果遇到版本不兼容的错误，尝试将两端都更新到最新版本。

### 连接后操作异常

- 确认远程机器的磁盘空间充足
- 确认远程 Codex 有权限访问目标项目目录
- 查看 Codex App 的日志输出（通常在 `~/.codex/logs/` 目录下）

## 七、与 VSCode Remote-SSH 的对比

| 特性 | VSCode Remote-SSH | Codex SSH Remote |
|------|-------------------|------------------|
| 成熟度 | 稳定，生产可用 | Alpha 阶段 |
| 编辑方式 | 本地 UI + 远程文件系统 | AI Agent 直接在远程执行 |
| 适用场景 | 需要手动编辑代码 | AI 辅助编码、批量操作 |
| 扩展支持 | 丰富的扩展生态 | 功能还在建设中 |

目前建议将 Codex SSH Remote 作为辅助工具使用，与现有开发流程配合，而非完全替代。

## 小结

Codex SSH Remote 功能虽然还在 alpha 阶段，但对于需要频繁在远程环境中使用 AI 辅助开发的场景来说，已经可以提升不少效率。核心配置步骤可以概括为：

1. 本地 `~/.codex/config.toml` 开启 feature flag
2. `~/.ssh/config` 配置好 SSH Host
3. 远程机器安装 Codex 并确保 PATH 可用
4. 在 Codex App 中添加连接并选择项目目录

配置过程中如果遇到问题，可以参考上方排查步骤逐一确认。

