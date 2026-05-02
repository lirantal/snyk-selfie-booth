# Dev container

Run this project in a **consistent Node.js 24 + TypeScript** environment without installing toolchains on your machine. Dependencies install automatically; your repo is the workspace inside the container.

## Why use it?

- **Same stack for everyone** — Node 24, pnpm, and tooling match CI and collaborators.
- **Fast onboarding** — Open the folder in a container; `post-create.sh` runs once after create (git prefs, CLIs, then dependency install via `utils/deps-install.sh`, which picks pnpm/npm/yarn/bun from lockfiles, repo markers, or `packageManager` in `package.json`).
- **Host secrets, container dev** — `ANTHROPIC_API_KEY` and `SNYK_TOKEN` are passed from your Mac/Linux session into the container when set locally (see below).
- **Optional CLI workflow** — Use `start.sh` if you prefer a terminal-driven container instead of only the editor.

## What’s here

| File | Role |
|------|------|
| `devcontainer.json` | Image, mounts (e.g. your `~/.gitconfig`), lifecycle commands, env forwarding. |
| `post-create.sh` | Index script for post-create: local git prefs, [APM](https://github.com/microsoft/apm), 1Password CLI, then delegates to `utils/deps-install.sh`. |
| `utils/deps-install.sh` | Chooses package manager (lockfile → repo markers → `package.json#packageManager` → npm) and runs install when `package.json` exists (errors do not fail container create). |
| `post-install.sh` | Runs on each container start after attach; extend for post-start tasks. Removes `.env.development` when that ephemeral file exists (see commented `initializeCommand` / `runArgs` in `devcontainer.json`). |
| `start.sh` | Brings the dev container up with the Dev Containers CLI, then opens a shell **inside** the container. |

## Usage

### Editor (recommended)

1. Install the **Dev Containers** extension (VS Code) or use Cursor’s dev container support.
2. **Command Palette** → *Dev Containers: Reopen in Container* (or *Rebuild Container* after config changes).
3. Wait for create/start; the editor attaches when ready. `post-install.sh` runs on each start (e.g. removes `.env.development` if present). Start the app with `pnpm dev` / `npm run dev` when you need it.

### Terminal only

From the **repository root** on your host:

```bash
bash .devcontainer/start.sh
```

Requires Docker running. Uses `npx @devcontainers/cli` to `up` the workspace, then `exec` into `bash`.

## Environment variables (host → container)

Set these **on your machine** before opening/rebuilding the container so they appear inside:

```bash
export ANTHROPIC_API_KEY=sk-...
export SNYK_TOKEN=...
```

They are wired in `devcontainer.json` under `containerEnv` via `localEnv`.

## Optional customization

- **Agent config on the host** — Uncomment the `mounts` entries in `devcontainer.json` to bind `~/.claude`, `~/.gemini`, or `~/.codex` into the container so coding agents see your existing settings.
- **1Password / other CLIs** — Follow the commented blocks in `devcontainer.json` and `post-create.sh` if you need them; keep the image lean by default.

---

After scaffolding, edit paths and secrets to match your team’s policies; this folder is yours to extend.
