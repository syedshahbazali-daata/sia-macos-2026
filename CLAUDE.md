# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

SiA (Smart Intelligent Assistant) is an Electron desktop app for social media automation. It lets users schedule posts across platforms (Twitter, Instagram, Facebook, TikTok, YouTube Shorts, OnlyFans), live-stream to multiple destinations simultaneously, and auto-fetch stream keys — all driven by Playwright-based browser automation using the `patchright` fork.

## Commands

```bash
npm run dev          # Start in development mode with hot reload
npm run build        # Typecheck + build all three processes
npm run build:mac    # Build + package for macOS (.dmg)
npm run build:win    # Build + package for Windows
npm run lint         # ESLint with auto-fix
npm run format       # Prettier auto-format
npm run typecheck    # Run tsc on both node and web tsconfigs
```

## Architecture

### Three-Process Electron Model

| Process | Entry | Role |
|---|---|---|
| **Main** | `src/main/index.ts` | Node.js host: IPC registration, window creation, app lifecycle |
| **Preload** | `src/preload/index.ts` | Bridge: exposes typed IPC APIs via contextBridge |
| **Renderer** | `src/renderer/src/` | React + Redux UI |

### Main Process Layout

```
src/main/
  index.ts          ← Slim entry: registers IPC, creates window
  types.ts          ← Scheduler and MediaPath types
  paths.ts          ← All file path constants (also IPC key names)
  ipc/
    schedulerIpc.ts ← Scheduler CRUD and run-scheduler handler
    streamIpc.ts    ← FFmpeg live stream IPC
    browserIpc.ts   ← Chromium download, account attachment, stream key fetch
    fileIpc.ts      ← Generic read-json-file / write-json-file
  services/
    fileService.ts  ← File read/write with allowlist guard
    streamService.ts← FFmpeg process lifecycle
    browserService.ts← Chromium download
  bots/             ← Playwright automation bots (run in main process)
    RunScheduler.ts ← Dispatcher: maps platform string to bot
    Twitter/Tiktok/YT/Insta/OnlyFans schedulers
    StreamKeysAutoFetch.ts
    AddAccount.tsx, Browser.tsx
```

### Renderer Layout

```
src/renderer/src/
  App.tsx                  ← Router + route definitions
  onboard/                 ← Pre-login flow (SplashScreen → License → Instance)
  workspace/
    base/                  ← Layout shell (sidebar + header)
    pages/
      Dashboard/           ← Analytics charts
      schedulers/          ← Post scheduling UI
      History/             ← Completed post history
      Livegate/            ← Live streaming
      Settings/            ← Account, signatures, descriptions
      Faq/                 ← FAQ accordion
      MasterInbox/         ← (placeholder)
  components/
    ui/                    ← shadcn/ui primitives
    PlanGate.tsx           ← Feature-level plan gating component
  hooks/
    usePlan.ts             ← Read active plan from stored license
  lib/
    license.ts             ← Firebase license lookup + validation
  redux/slices/            ← instanceSlice, SchedulerSlice, currentSlice, SelectedInstanceSlice
  types/
    license.ts             ← License, Plan, PlanFeature types + PLAN_FEATURES map
```

### User Tier System

Licenses have a `plan` field: `'free' | 'pro' | 'enterprise'`.

- Use `usePlan()` hook to read the current plan
- Use `<PlanGate feature="livegate">` to gate features — shows an upgrade prompt to free users
- `PLAN_FEATURES` in `src/renderer/src/types/license.ts` maps each plan to its allowed features

### Persistence

- **Renderer**: `encrypt-storage` wrapping `localStorage`. Keys: `INSTANCE`, `LICENSE` (see `helpers/storageHelper.js`).
- **Main**: JSON files in `app.getPath('userData')`. All paths defined in `src/main/paths.ts`. The IPC key names (e.g. `'STREAM_KEYS'`) map directly to `PATHS` keys.

### Automation Bots

Bots run in the **main process**, launched via `run-scheduler` IPC. They use `patchright` (Playwright fork with fingerprint spoofing) against a persistent Chromium context stored per-instance at `userData/userdir-<instanceId>`. The Chromium binary is downloaded at first run to `userData/chromium/`.

### Live Streaming

`LivegateNow.tsx` captures webcam/mic via `getUserMedia`, encodes frames with WebCodecs, sends chunks to main via `stream-data` IPC. Main pipes them into FFmpeg which outputs RTMP. Auto-retry up to 3 times on failure.

## Key IPC Channels

| Channel | Direction | Purpose |
|---|---|---|
| `run-scheduler` | invoke | Execute automation bot |
| `read-json-file` / `write-json-file` | invoke | Read/write named data files |
| `read-schedules` / `get-scheduler` | invoke | Load schedulers |
| `add-scheduler` / `delete-scheduler` | send/invoke | Mutate scheduler list |
| `move-scheduler-to-history` | invoke | Mark post as completed |
| `fetch-stream-key` | invoke | Auto-fetch RTMP key |
| `start-stream` / `stream-data` / `stop-stream` | send | FFmpeg live streaming |
| `add-account` / `account-added` | send/reply | Account attachment |
| `browser-exists` / `download-browser` | send/reply | Chromium setup |
| `scheduler-history-updated` | main→renderer | Notify UI after bot completes |

## Branch Structure

- `main` — stable, always releasable
- `feature/license-system` — plan tiers, PlanGate, license validation
- `feature/scheduler` — post scheduling UI
- `feature/livegate` — live streaming
- `feature/settings` — settings and accounts
- `feature/history` — post history
- `feature/automation-bots` — bot cleanup
- `feature/dashboard` — analytics
- `feature/master-inbox` — inbox

## Building & Packaging

- `ffmpeg-static` is in `asarUnpack` in `electron-builder.yml` — FFmpeg must be outside the asar.
- macOS requires notarization (`scripts/notarize.cjs`) and entitlements (`build/entitlements.mac.plist`).
- `patchright` and `playwright` must stay in `dependencies` (not devDependencies).
- App ID: `com.sia.app`
