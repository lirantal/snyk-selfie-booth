#!/usr/bin/env bash
# Install workspace JS dependencies when package.json exists (non-fatal on failure).

[ -f package.json ] && pnpm install || true
