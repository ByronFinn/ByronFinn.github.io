# All the Tmux You'll Ever Use: Sessions, Panes, Detach


You SSH into a server to run a long task, the network drops, and the task is gone. Tmux exists to solve exactly this — it decouples the terminal session from the window, so the process keeps running after you close the terminal.

<!-- more -->

{{< image src="/pictures/posts/tmux-session-window-pane.svg" caption="Tmux's three layers: a Session contains Windows, a Window contains Panes" alt="Tmux session-window-pane structure diagram" title="Tmux's three layers" width="800" class="center" >}}

## The Core Problem It Solves

An ordinary terminal window is bound to its processes. Close the window and the processes die. Same story when SSH drops.

Tmux decouples the session from the window: close the terminal or lose SSH, and the processes inside the session keep running. Reattach later, and everything is as you left it.

GNU Screen is the other tool in this category. Tmux is easier to use and does more — there's little reason to pick Screen.

## The Three Layers

Tmux has three layers; get them straight and you'll never feel lost:

- **Session**: the outermost container. A session can hold multiple windows. After detaching, the session keeps running in the background.
- **Window**: tabs within a session; the status bar at the bottom shows their numbers and names.
- **Pane**: split regions inside a window; each pane runs its own command.

In daily use, one session per project, with windows and panes split as needed.

## Installation

```bash
# Ubuntu / Debian
sudo apt-get install tmux

# CentOS / Fedora
sudo yum install tmux

# macOS
brew install tmux
```

## Session Operations

These few commands cover 80% of daily use:

```bash
# Create a named session (skip the default numbers — two days later you won't remember what 0 and 1 were)
tmux new -s dev

# Detach the session (back to the plain terminal; the session keeps running in the background)
# Shortcut: Ctrl+b d
tmux detach

# List all sessions
tmux ls

# Reattach to a session
tmux attach -t dev
# Or the short form
tmux a -t dev

# Kill a session
tmux kill-session -t dev
```

Session shortcuts:

| Shortcut | Action |
|--------|------|
| `Ctrl+b d` | Detach the current session |
| `Ctrl+b s` | List all sessions |
| `Ctrl+b $` | Rename the current session |

## Pane Splitting

Slice one window into pieces and watch several commands' output at once.

```bash
# Split top/bottom
tmux split-window
# Shortcut: Ctrl+b "

# Split left/right
tmux split-window -h
# Shortcut: Ctrl+b %

# Switch panes
# Shortcut: Ctrl+b + arrow keys

# Zoom the current pane (press again to restore)
# Shortcut: Ctrl+b z

# Close the current pane
# Shortcut: Ctrl+b x
```

Common pane shortcuts:

| Shortcut | Action |
|--------|------|
| `Ctrl+b %` | Split left/right |
| `Ctrl+b "` | Split top/bottom |
| `Ctrl+b` arrow keys | Switch between panes |
| `Ctrl+b z` | Zoom/restore |
| `Ctrl+b x` | Close pane |
| `Ctrl+b q` | Show pane numbers |
| `Ctrl+b Ctrl+arrow keys` | Resize pane |

## Window Management

Multiple windows inside a session — like tabs in a terminal.

| Shortcut | Action |
|--------|------|
| `Ctrl+b c` | New window |
| `Ctrl+b n` | Next window |
| `Ctrl+b p` | Previous window |
| `Ctrl+b 0-9` | Jump to window by number |
| `Ctrl+b w` | Pick a window from a list |
| `Ctrl+b ,` | Rename window |

## A Real Workflow

{{< image src="/pictures/posts/tmux-cheatsheet.svg" caption="Tmux common operations cheat sheet and the minimal workflow" alt="Tmux cheat sheet" title="Cheat sheet" width="800" class="center" >}}

A typical development scenario:

```bash
# 1. SSH to the server, start a named session
ssh user@server
tmux new -s project

# 2. Split: edit on the left, run on the right
# Ctrl+b %  split left/right
# vim on the left, tests on the right

# 3. Heading out? Detach
# Ctrl+b d

# 4. Come back, reattach — everything is still there
tmux a -t project
```

For long-running tasks on an Oracle free VPS ({{< ref "posts/2026-05-22-oracle-free-vps-guide.md" >}}), tmux is basically mandatory — when SSH drops, the processes must not drop with it.

Pair it with SSH remote development ({{< ref "posts/2026-05-17-codex-ssh-remote-guide.md" >}}) and the VPS jargon primer ({{< ref "posts/2026-05-16-vps-glossary-guide.md" >}}), and you've got the basics of working on remote servers covered.

## Configuration File (Optional)

The defaults are fine. To change the prefix key or add mouse support, create `~/.tmux.conf`:

```bash
# Change the prefix from Ctrl+b to Ctrl+a (what Screen users are used to)
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# Enable mouse support (click panes, resize, scroll with the mouse)
set -g mouse on

# Number panes from 1 (0 is too far away on the keyboard)
set -g base-index 1
setw -g pane-base-index 1
```

Apply the changes:

```bash
tmux source-file ~/.tmux.conf
```

This is personal taste — it works fine without any of it. For most people, adding `set -g mouse on` is enough.

