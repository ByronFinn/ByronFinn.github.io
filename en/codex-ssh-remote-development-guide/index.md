# A Guide to SSH Remote Development in the Codex App


<!-- more -->

> **Update note**: This post is based on the Codex App as of May 2026. SSH Remote is still in alpha, and the configuration methods and UI entry points may change with new releases. If anything here has gone stale, refer to the [official documentation](https://github.com/openai/codex) for the latest.

The Codex App now supports connecting to remote machines over SSH; the feature is currently in alpha.

If you develop on remote servers, train models, or run environments there, this is worth a try. It lets you connect to a remote server directly inside Codex and work in the remote filesystem and shell — no more jumping back and forth between a local terminal, VSCode Remote, SSH, and tmux.

## 1. Who Is This For?

Worth a close look if:

- You write code locally and run models on lab or company GPU servers
- Your backend project depends on a remote deployment environment (code, dependencies, databases, and services all live on a remote devbox)
- You spend your days in `ssh + tmux + vim` or VSCode Remote-SSH
- You need to switch development environments across multiple machines

This kind of workflow used to look like:

```bash
ssh devbox
cd project
tmux attach
# then edit and run scripts by hand
```

Now Codex is bringing the "remote development environment" in as a first-class citizen.

{{< image src="/pictures/note/codex-ssh-remote-arch.svg" caption="Local → remote SSH connection architecture" width="800px" >}}

## 2. Enabling the SSH Remote Feature

{{< image src="/pictures/note/codex-ssh-remote-steps.svg" caption="The three core configuration steps" width="900px" >}}

The feature is still in alpha, so you need to flip the feature flag manually.

Edit the local Codex config at `~/.codex/config.toml` and add:

```toml
[features]
remote_control = true
remote_connections = true
```

Save, then restart the Codex App.

{{< admonition type=warning title="Alpha Feature Warning" >}}
This feature is in alpha; configuration options, entry point locations, and stability may all change. Test it in a non-production environment first.
{{< /admonition >}}

## 3. Configuring the SSH Host

The official recommendation is to add the remote machine to your local SSH config first, so Codex can auto-discover the configured SSH host.

Edit `~/.ssh/config`:

```ssh-config
Host devbox
  HostName your_server_ip_or_domain
  User your_username
  Port 22
  IdentityFile ~/.ssh/id_ed25519
```

Once configured, verify connectivity from a local terminal first:

```bash
ssh devbox
```

If this fails, Codex will almost certainly fail too. Check first:

- Is the network reachable (test the port with `ping` or `telnet`)
- Is the key correct (see verbose logs with `ssh -v devbox`)
- Do the username and port match

## 4. Preparing the Remote Machine

When the Codex App connects to a remote project, it starts a Codex app server on the remote machine over SSH. So the remote machine needs to satisfy these conditions:

1. **Codex installed** — the remote side needs the Codex CLI too
2. **Authenticated** — the remote side must be logged in and authorized
3. **On PATH** — the `codex` command must be reachable in the remote login shell's PATH

SSH into the remote machine and check:

```bash
which codex
codex --version
```

If `which codex` prints nothing, the remote shell can't find Codex. Common causes and fixes:

| Problem | Fix |
|------|----------|
| Codex not installed | Install it per the [official installation docs](https://github.com/openai/codex) |
| Installed but not on PATH | Check that `~/.bashrc` / `~/.zshrc` / `~/.profile` adds it to PATH correctly; note that an SSH non-interactive shell may not load all config files |
| Permission issues | Confirm the Codex binary is executable (`chmod +x`) |

{{< admonition type=info title="About the SSH shell environment" >}}
An SSH non-interactive login (which is how Codex connects) usually loads only `~/.bash_profile` or `~/.profile`, and **not** `~/.bashrc`. If your PATH setup lives in `~/.bashrc`, you may need to add `source ~/.bashrc` to `~/.bash_profile`, or put the PATH directly in `~/.profile`.
{{< /admonition >}}

## 5. Adding a Remote Project in the Codex App

After restarting the Codex App, follow these steps:

1. Open the Codex App
2. Go to **Settings**
3. Find **Connections**
4. Add or enable the configured SSH host
5. Pick the project directory on the remote machine
6. Create or open the remote project thread

Once configured, Codex's file reads, file writes, and command runs all execute on the remote machine directly. It isn't simply "viewing remote code" — it works fully inside the remote environment.

## 6. Troubleshooting

### Connection timeouts or failures

```bash
# Debug step by step from a local terminal
ssh -v devbox              # Verbose SSH connection log
ssh devbox "which codex"   # Confirm the remote PATH works
ssh devbox "codex --version"  # Confirm remote Codex is available
```

### Remote Codex version mismatch

The local Codex client and remote server versions need to match. If you hit a version-incompatibility error, try updating both ends to the latest version.

### Unexpected behavior after connecting

- Confirm the remote machine has enough disk space
- Confirm remote Codex has permission to access the target project directory
- Check the Codex App's log output (usually under `~/.codex/logs/`)

## 7. Compared with VSCode Remote-SSH

| Aspect | VSCode Remote-SSH | Codex SSH Remote |
|------|-------------------|------------------|
| Maturity | Stable, production-ready | Alpha |
| Editing model | Local UI + remote filesystem | AI agent executes directly on the remote |
| Best for | Manual code editing | AI-assisted coding, bulk operations |
| Extension support | Rich extension ecosystem | Features still being built |

For now, treat Codex SSH Remote as a companion tool that works alongside your existing development workflow, not a full replacement.

## Wrap-up

Codex SSH Remote is still in alpha, but for workflows that lean heavily on AI-assisted development in remote environments, it already saves real time. The core configuration steps boil down to:

1. Enable the feature flag in local `~/.codex/config.toml`
2. Configure the SSH host in `~/.ssh/config`
3. Install Codex on the remote machine and make sure it's on PATH
4. Add the connection in the Codex App and pick the project directory

If anything goes wrong during setup, work through the troubleshooting steps above one by one.

