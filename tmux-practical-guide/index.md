# Tmux 用到的就这些：会话、分屏、 detach


SSH 到服务器上跑个长任务，网络断了，任务没了。Tmux 就是解决这个问题的——把终端会话和窗口解绑，关了终端进程还在跑。

<!-- more -->

{{< image src="/pictures/posts/tmux-session-window-pane.svg" caption="Tmux 三层结构：Session 包含 Window，Window 包含 Pane" alt="Tmux Session Window Pane 结构图" title="Tmux 三层结构" width="800" class="center" >}}

## 解决的核心问题

普通终端窗口和进程绑在一起。关窗口，进程就没了。SSH 断线同理。

Tmux 把会话（session）和窗口解绑：你关掉终端、断开 SSH，会话里的进程继续跑。下次接上，一切照旧。

同类工具还有 GNU Screen。Tmux 比 Screen 好用，功能也多，没什么理由选 Screen。

## 三层结构

Tmux 有三个层级，搞清楚就不会晕：

- **Session**（会话）：最外层容器。一个 session 可以包含多个 window。detach 后 session 还在后台跑。
- **Window**（窗口）：session 内的标签页，底部状态栏显示编号和名称。
- **Pane**（窗格）：一个 window 内的分割区域，每个 pane 跑各自的命令。

日常使用中，一般一个项目开一个 session，里面按需要分 window 和 pane。

## 安装

```bash
# Ubuntu / Debian
sudo apt-get install tmux

# CentOS / Fedora
sudo yum install tmux

# macOS
brew install tmux
```

## 会话操作

日常 80% 的时间就在用这几个命令：

```bash
# 新建命名会话（别用默认编号，过两天忘了 0 和 1 分别是什么）
tmux new -s dev

# 分离会话（回到普通终端，session 在后台继续跑）
# 快捷键：Ctrl+b d
tmux detach

# 列出所有会话
tmux ls

# 接回某个会话
tmux attach -t dev
# 或者简写
tmux a -t dev

# 杀死会话
tmux kill-session -t dev
```

会话快捷键：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+b d` | 分离当前会话 |
| `Ctrl+b s` | 列出所有会话 |
| `Ctrl+b $` | 重命名当前会话 |

## 窗格（Pane）分屏

一个窗口切成几块，同时看多个命令的输出。

```bash
# 上下分屏
tmux split-window
# 快捷键：Ctrl+b "

# 左右分屏
tmux split-window -h
# 快捷键：Ctrl+b %

# 切换窗格
# 快捷键：Ctrl+b + 方向键

# 全屏当前窗格（再按一次恢复）
# 快捷键：Ctrl+b z

# 关闭当前窗格
# 快捷键：Ctrl+b x
```

常用窗格快捷键：

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+b %` | 左右分屏 |
| `Ctrl+b "` | 上下分屏 |
| `Ctrl+b 方向键` | 切换窗格 |
| `Ctrl+b z` | 全屏/还原 |
| `Ctrl+b x` | 关闭窗格 |
| `Ctrl+b q` | 显示窗格编号 |
| `Ctrl+b Ctrl+方向键` | 调整窗格大小 |

## 窗口（Window）管理

一个 session 里开多个 window，相当于终端里的标签页。

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+b c` | 新建窗口 |
| `Ctrl+b n` | 下一个窗口 |
| `Ctrl+b p` | 上一个窗口 |
| `Ctrl+b 0-9` | 跳到指定编号窗口 |
| `Ctrl+b w` | 列表选择窗口 |
| `Ctrl+b ,` | 重命名窗口 |

## 实际工作流

{{< image src="/pictures/posts/tmux-cheatsheet.svg" caption="Tmux 常用操作速查与最简工作流" alt="Tmux 速查表" title="速查" width="800" class="center" >}}

一个典型的开发场景：

```bash
# 1. SSH 到服务器，开一个命名会话
ssh user@server
tmux new -s project

# 2. 分屏：左边编辑，右边运行
# Ctrl+b %  左右分屏
# 左边跑 vim，右边跑测试

# 3. 需要出门了，分离
# Ctrl+b d

# 4. 回来后接上，一切还在
tmux a -t project
```

在 Oracle 免费 VPS（{{< ref "posts/2026-05-22-oracle-free-vps-guide.md" >}}）上跑长任务，Tmux 基本是必须的——SSH 断了进程不能跟着断。

配合 SSH 远程开发（{{< ref "posts/2026-05-17-codex-ssh-remote-guide.md" >}}）和 VPS 术语扫盲（{{< ref "posts/2026-05-16-vps-glossary-guide.md" >}}），远程服务器上的基本操作就齐了。

## 配置文件（可选）

默认配置够用。如果想改前缀键或加鼠标支持，创建 `~/.tmux.conf`：

```bash
# 把前缀键从 Ctrl+b 改成 Ctrl+a（Screen 用户的习惯）
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# 开启鼠标支持（可以用鼠标切换窗格、调整大小、滚动）
set -g mouse on

# 窗格编号从 1 开始（0 在键盘太远了）
set -g base-index 1
setw -g pane-base-index 1
```

改完后生效：

```bash
tmux source-file ~/.tmux.conf
```

这是个人偏好，不改也能用。多数人加一个 `set -g mouse on` 就够了。

