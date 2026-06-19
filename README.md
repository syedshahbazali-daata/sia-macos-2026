# SiA – Smart Intelligent Assistant

SiA is a desktop application for social media managers and content creators. It automates posting, scheduling, and live streaming across multiple social platforms from a single interface.

## What It Does

- **Post Scheduler** – Schedule and auto-publish content to Twitter, Instagram, Facebook, TikTok, YouTube Shorts, and OnlyFans using browser automation.
- **Live Streaming (Livegate)** – Stream your webcam/microphone simultaneously to YouTube, Twitch, Twitter/X, and Instagram via RTMP — no third-party streaming service needed.
- **Stream Key Fetcher** – Automatically retrieves RTMP stream keys from platform dashboards so you don't have to copy-paste them manually.
- **Multi-Instance** – Create isolated browser profiles ("instances") for different accounts, each with its own password and session.
- **History** – Tracks all posts that have been published.
- **Settings** – Manage attached accounts, custom post descriptions, and signatures.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron 31 |
| UI framework | React 18 + TypeScript |
| Build tool | electron-vite + Vite 5 |
| Styling | Tailwind CSS + shadcn/ui (Radix UI) |
| State management | Redux Toolkit |
| Browser automation | Patchright (Playwright fork) |
| Video encoding | FFmpeg (via ffmpeg-static) |
| License validation | Firebase Firestore |
| Encrypted local storage | encrypt-storage |

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the Electron app with hot reload. The renderer runs on a local Vite dev server; main and preload are watched and rebuilt automatically.

### Build

```bash
npm run build:mac    # macOS (.dmg)
npm run build:win    # Windows (installer)
npm run build:linux  # Linux (AppImage / deb / snap)
```

### Other Commands

```bash
npm run lint         # ESLint
npm run format       # Prettier
npm run typecheck    # TypeScript check (both node and web)
```

## First Run

On first launch, SiA will:

1. Ask you to enter a **license key** (validated against Firebase).
2. Download a **Chromium browser** to your app data directory — this powers all automation.
3. Prompt you to create an **instance** (a named browser profile).

After setup, use the **Settings → Attached Accounts** screen to log into each social platform inside SiA's managed browser.

## Project Structure

```
src/
  main/         Electron main process (IPC, FFmpeg, file storage)
  preload/      Context bridge (exposes IPC APIs to renderer)
  renderer/src/ React application
    onboard/    License, instance setup, browser download screens
    workspace/  Main app (dashboard, schedulers, livegate, settings, history)
    redux/      State management (instances, schedulers)
    lib/        License verification, scheduler helpers
    helpers/    Encrypted storage wrapper
automation-bots/  Playwright automation scripts (run inside main process)
build/            Electron Builder assets (icons, entitlements)
scripts/          macOS notarization script
```

## License

Proprietary. A valid license key is required to use the application.
