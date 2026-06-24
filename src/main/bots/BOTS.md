# Automation Bots — Reference

> **Keep this file updated whenever a bot file changes.**
> Each section maps 1:1 to a source file in `src/main/bots/`.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Shared data types](#shared-data-types)
3. [RunScheduler.ts — dispatcher](#runschedulerts--dispatcher)
4. [Bot files](#bot-files)
   - [TwitterScheduler.tsx](#twitterschedulertsx)
   - [TiktokScheduler.tsx](#tiktokschedulertsx)
   - [InstaFbPostScheduler.tsx](#instafbpostschedulertsx)
   - [InstaStoriesScheduler.tsx](#instaStoriesschedulertsx)
   - [YTVideoScheduler.tsx](#ytvideoscheduletrsx)
   - [OnlyFansPostScheduler.tsx](#onlyfanspostschedulertsx)
   - [OnlyFansMassMessaging.tsx](#onlyfansmassmessagingtsx)
5. [Utility files](#utility-files)
   - [StreamKeysAutoFetch.ts](#streamkeysautofetchts)
   - [AddAccount.tsx](#addaccounttsx)
   - [Browser.tsx](#browsertsx)
6. [Error handling](#error-handling)
7. [Adding a new bot](#adding-a-new-bot)
8. [Known quirks and gotchas](#known-quirks-and-gotchas)

---

## Architecture overview

```
IPC: run-scheduler
      │
      ▼
RunScheduler.ts        ← receives platform string + schedules array
      │
      ├─ launches patchright persistent context (per-instance userDir)
      ├─ opens one Page
      └─ looks up platform in PLATFORM_MAP
              │
              ▼
        Bot function(page, schedules, jsonFilePath, moveToHistory)
              │
              ├─ iterates schedules where isScheduled === 0
              ├─ drives the browser via Playwright selectors
              └─ calls moveToHistory(id, path) on success
```

All bots run in the **Electron main process** (Node.js). They use `patchright` — a Playwright fork with fingerprint spoofing — against a **persistent Chromium context** stored at `userData/userdir-<instanceId>` so login sessions survive between runs.

---

## Shared data types

Defined in `src/main/types.ts` and re-declared locally inside each bot file (they mirror each other — if you change the canonical type, update the local copies too):

```ts
interface Scheduler {
  id: string           // UUID
  Instance_id: string  // which SiA account instance
  description_type: string
  city: string         // used as a display label in some bots (TikTok header)
  isScheduled: number  // 0 = pending, 1 = done
  description_text: string
  signature: string    // appended after description_text with \n
  set_price: number    // > 0 triggers paid media flow (OnlyFans only)
  set_date: string     // "YYYY-MM-DD"
  set_time: string     // "HH:MM" (24-hour) — exceptions noted per bot
  media_path: MediaPath[]
  platform: string
  created_at: number   // unix ms
}

interface MediaPath {
  filePath: string     // absolute path on disk
  previewUrl: string
  isPaid: boolean      // OnlyFans: separates free-preview vs paid content
}
```

**`isScheduled` lifecycle:** `0` → bot runs this item → `moveToHistory` sets it to `1` → renderer is notified via `scheduler-history-updated` IPC event.

---

## RunScheduler.ts — dispatcher

**File:** `src/main/bots/RunScheduler.ts`

### What it does

1. Reads/writes the scheduler JSON file on disk.
2. Launches a single `patchright` persistent context (`headless: false`, `viewport: null`) shared across all schedules in that run.
3. Dispatches to the correct bot via `PLATFORM_MAP`.
4. On any uncaught error: takes a page screenshot, sends `scheduler-error` IPC to the renderer with `{ platform, errorMessage, screenshotBase64, timestamp }`.
5. Always closes the browser context in `finally`.

### PLATFORM_MAP

| Key (lowercase) | Handler |
|---|---|
| `twitter post` | `TwitterPostScheduler` |
| `tik tok post` | `TikTokPostScheduler` |
| `instagram post` | `InstaFbPostScheduler` |
| `facebook` | `InstaFbPostScheduler` |
| `of post` | `OfPostScheduler` |
| `youtube shorts` | `YTVideoScheduler` |
| `instagram story` | `InstaStoryScheduler` |
| `of mass messaging` | `OnlyFansMassMessageScheduler` |

### moveToHistory

Sets `scheduler.isScheduled = 1` in the JSON file, then fires `scheduler-history-updated` to the renderer window.

### Exported error type

```ts
interface SchedulerErrorData {
  platform: string
  errorMessage: string
  screenshotBase64: string  // base64 PNG, empty string if screenshot fails
  timestamp: number         // Date.now()
}
```

---

## Bot files

### TwitterScheduler.tsx

**Export:** `TwitterPostScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://x.com/home`

**Flow per schedule:**

1. Navigate to `x.com/home`.
2. Wait for `[data-testid="tweetTextarea_0"]`, click it, type `description_text + \n + signature`.
3. Upload media via `[data-testid="fileInput"]` (if any). Poll `document.body.innerText` for "uploading" text every 2 s (up to 60 × 2 s = 2 min) — Twitter's CSP blocks `waitForFunction`.
4. Re-click compose area to restore focus after video upload.
5. Open schedule picker via `dispatchEvent` on `[data-testid="scheduleOption"]` (direct clicks are intercepted by the `#layers` overlay). Retry once if the picker doesn't open.
6. Fill date/time using `getElementById` + `dispatchEvent('change')` on `SELECTOR_1` … `SELECTOR_5` (month, day, year, hour, minute — all numeric, no AM/PM, 24-hour).
7. Dispatch click on the "Confirm" button (found by `innerText` scan inside `#layers`).
8. Wait for `[data-testid="tweetButtonInline"]:not([aria-disabled])`, then dispatch click.
9. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"` → split and strip leading zeros (Twitter selects by numeric value).
- `set_time`: `"HH:MM"` 24-hour → split and strip leading zeros.

**Key quirk:** Twitter's CSP blocks Playwright's `waitForFunction` / `waitForSelector` for elements inside `#layers`. All interactions there use `page.evaluate` with `getElementById` or a full-DOM scan.

---

### TiktokScheduler.tsx

**Export:** `TikTokPostScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://www.tiktok.com/creator#/upload?scene=creator_center`

**Flow per schedule:**

1. Navigate to TikTok home, then to the upload URL.
2. Inject a full-width "Uploading to TikTok from `city`" banner via `page.evaluate`.
3. Make the hidden file input visible via JS, then `setInputFiles`.
4. Fill the caption combobox (`[role="combobox"]`) with `description_text + \n + signature`.
5. Poll until `//button[not(@disabled)]//div[text()="Post"]` is visible and enabled.
6. Click the "Schedule" label toggle.
7. Handle the optional "Allow" dialog (3 s timeout, swallowed if absent).
8. Navigate the calendar picker by comparing month/year text to target, clicking prev/next arrows.
9. Set time via `.tiktok-timepicker-left` (hours) and `.tiktok-timepicker-right` (minutes) spans. Minutes are **rounded up to nearest 5** — TikTok only shows 5-minute intervals.
10. Click the "Schedule" submit button via `page.evaluate`.
11. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"`.
- `set_time`: `"HH:MM"` 24-hour. Minutes rounded up to nearest 5 internally.

**Key quirk:** File input is hidden; must be made visible via JS before `setInputFiles`.

---

### InstaFbPostScheduler.tsx

**Export:** `InstaFbPostScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://business.facebook.com/latest/composer`

**Handles both Instagram posts and Facebook posts** depending on `schedule.platform`.

**Flow per schedule:**

1. Navigate to the Meta Business composer.
2. Open the platform dropdown (`[aria-haspopup="listbox"]`). If the *other* platform's option exists, deselect it by clicking it (the selector targets the opposite platform — toggling off what's already selected).
3. For each media file: detect image vs video by file extension, click the appropriate "Add photo/video" button, handle the "Upload from…" sub-menu if it appears, then set files via the file chooser.
4. Type description + signature into the post text dialog.
5. Click the Scheduling toggle (`//*[contains(text(), 'Scheduling')]/../..//input[@role='switch']`).
6. Fill the date input with `MM/DD/YYYY` format.
7. Fill time: tries `[aria-label='meridiem']` first (AM/PM input); falls back to 24→12-hour conversion if that element isn't present.
8. Click the "Schedule" confirmation button.
9. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"` → converted to `M/D/YYYY`.
- `set_time`: `"HH:MM"` 24-hour (bot converts to 12-hour + AM/PM internally) — **or** already in 12-hour "HH:MM AM/PM" form; the bot handles both.

**Key quirk:** The platform deselect logic is inverted by design — it clicks the *opposite* platform's option to uncheck it from a multi-select dropdown.

---

### InstaStoriesScheduler.tsx

**Export:** `InstaStoryScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://business.facebook.com/latest/story_composer`

**Flow per schedule:**

1. Navigate to the Meta Business story composer.
2. Deselect Facebook from the platform dropdown (same inverted logic as InstaFbPostScheduler).
3. For each media file: detect image vs video, use `Promise.all([waitForEvent('filechooser'), click])` pattern.
4. Toggle the Scheduling switch.
5. Fill date as `M/D/YYYY` and press Enter.
6. Convert `set_time` from 24-hour to 12-hour + AM/PM; fill hours, minutes, meridiem inputs.
7. Click the "Schedule" button.
8. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"` → converted to `M/D/YYYY`.
- `set_time`: `"HH:MM"` 24-hour → converted to 12-hour + AM/PM.

---

### YTVideoScheduler.tsx

**Export:** `YTVideoScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://studio.youtube.com/`

**Flow per schedule:**

1. Navigate to YouTube Studio.
2. Click the `#create-icon` button then "Upload videos".
3. Wait for "Select" text, open file chooser, upload all media.
4. Fill `#textbox` with `description_text + " " + signature` (space-separated, not newline).
5. Select "Not Made for Kids" (`[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]`).
6. Click "Next" 3 times (Details → Video elements → Checks → Visibility).
7. Click `#second-container-expand-button` to expand scheduling options.
8. Fill time input (`#labelAndInputContainer input`) with `set_time`, press Enter.
9. Click `#datepicker-trigger`, fill the second input with the formatted date (`Jan 11 2025` style via `Intl.DateTimeFormat`), press Enter.
10. Click `[aria-label='Schedule']`.
11. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"` → reformatted to `"MMM D YYYY"` (e.g. `"Jan 11 2025"`).
- `set_time`: expects `"HH:MM AM/PM"` (12-hour with AM/PM) — YouTube Studio's time input uses 12-hour format. **Note: the bot passes `set_time` directly without conversion** — the renderer must supply 12-hour format for this platform.

---

### OnlyFansPostScheduler.tsx

**Export:** `OfPostScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://onlyfans.com/my/queue`

**Flow per schedule:**

1. Navigate to the OF queue page.
2. Click `[at-attr="add_event_header"]`.
3. Set date: click year picker → select year → Save → click month picker → select month name → Save → click day cell → Next.
4. Set time: click time picker, select AM/PM div, select hour from `.vdatetime-time-picker__list--hours`, select minute from `.vdatetime-time-picker__list--minutes` → Save. Hours are converted from 24-hour (0–23) to 12-hour (1–12).
5. Click "Post" button.
6. Handle **paid media** (if `set_price > 0`):
   - Upload free-preview files to `#attach_file_photo`.
   - Click `[at-attr="price_btn"]`, fill price, Save.
   - Navigate back, select all `.checkbox-item` buttons via JS evaluate, confirm.
7. Upload paid files to `#attach_file_photo`.
8. Type description + signature into `[data-placeholder="Compose new post..."]`.
9. Click `[at-attr="submit_post"]:not([disabled])`.
10. Call `moveToHistory`.

**Date/time format expected:**
- `set_date`: `"YYYY-MM-DD"`.
- `set_time`: `"HH:MM"` 24-hour → converted to 12-hour + AM/PM.

**Key quirk:** `media_path` on this bot is typed as `string[]` in the local interface but is actually `MediaPath[]` at runtime — the `isPaid` filtering uses `.filter(file => file.isPaid === true)`.

---

### OnlyFansMassMessaging.tsx

**Export:** `OnlyFansMassMessageScheduler(page, schedules, jsonFilePath, moveToHistory)`

**URL:** `https://onlyfans.com/my/queue`

**Identical date/time/media flow to `OfPostScheduler`**, with these differences:

- Clicks `//button[text()=" Mass message "]` instead of the "Post" button.
- Types into `[data-placeholder*="a message"]` instead of the post compose box.
- After content is ready: clicks `//a//*[contains(text(), 'Fans')]/../..` (the "All Fans" recipient selector), then the send button `[at-attr="send_btn"]:not([disabled])`, then confirms with `//button[text()=' Yes ']`.

---

## Utility files

### StreamKeysAutoFetch.ts

**Export:** `StreamKeysAutoFetch(platform, userDir, browserPath, _userDirId): Promise<string>`

Launches its own persistent browser context (separate from the scheduler context). Returns the RTMP stream key as a string.

| Platform | URL | Method |
|---|---|---|
| `twitch` | `dashboard.twitch.tv/u/<user>/settings/stream` | Clicks "Show" → "I Understand", reads `input#primary-stream-key` value |
| `youtube` | `studio.youtube.com/channel/UC/livestreaming` | Clicks `#copy-button`, reads via `clipboardy` |
| `twitter` | `studio.x.com/producer/sources` | Finds or creates a source named "SiA" (region `sa-east-1`), reads RTMP key span, then calls `startTwitterBroadcast` |
| `instagram` | `instagram.com` | Navigates new post → Live video → fills title → sets Public audience → reads `input[name="live-creation-modal-start-pane-stream-key"]` value |

`startTwitterBroadcast` (internal helper): Navigates to `studio.x.com/producer/broadcasts`, creates a broadcast titled "We are Live" with source "SiA" and category "Life".

---

### AddAccount.tsx

**Exports:** `addAccountPlaywright(url, userDir, browserPath)`, `closeBrowser()`

Opens a persistent browser context at the given URL so the user can log in manually. The session is persisted to `userDir`.

Special OnlyFans handling: listens to network requests. On `api2/v2/users/me` after login, clicks the account icon. On `/api2/v2/posts/tagged-friend-users`, parses and logs tagged creator data.

---

### Browser.tsx

**Export (default):** `runBrowser(userDir, _browserPath)`

Opens a persistent browser to `google.com` and holds it open indefinitely (via an unresolved Promise). Exits via `process.exit(0)` when the browser window is closed by the user. Used for the "Open Browser" feature so users can browse with the instance's session.

---

## Error handling

Every bot throws on failure (re-throws from inner try/catch). `RunScheduler` catches this at the top level:

```
bot throws
  → RunScheduler catches
  → takes page.screenshot() → base64
  → sends 'scheduler-error' IPC to renderer: { platform, errorMessage, screenshotBase64, timestamp }
  → closes browser context
```

The renderer displays this error in the `SchedulerError` component (`src/renderer/src/workspace/pages/schedulers/components/SchedulerError/`).

---

## Adding a new bot

1. Create `src/main/bots/MyPlatformScheduler.tsx`.
2. Export an async function with the signature:
   ```ts
   export async function MyPlatformScheduler(
     page: Page,
     schedules: Schedule[],
     jsonFilePath: string,
     moveToHistory: (id: string, path: string) => void
   ): Promise<void>
   ```
3. Loop over `schedules`, skip any where `isScheduled !== 0`, call `moveToHistory(schedule.id, jsonFilePath)` on success, and `throw error` on failure.
4. Import and add to `PLATFORM_MAP` in `RunScheduler.ts`:
   ```ts
   'my platform key': MyPlatformScheduler,
   ```
   The key must match the lowercase `platform` string stored in the schedule JSON exactly.
5. Update this document — add a section under [Bot files](#bot-files) following the same structure.

---

## Known quirks and gotchas

| Platform | Quirk |
|---|---|
| **Twitter** | CSP blocks `waitForFunction` and `waitForSelector` for `#layers` DOM. Use `page.evaluate` + `getElementById` for all scheduler picker interactions. |
| **Twitter** | The `#layers` overlay also intercepts native Playwright clicks on toolbar buttons — use `dispatchEvent(new MouseEvent(...))` instead. |
| **Twitter** | Video upload progress must be polled via `document.body.innerText` check (CSP again). |
| **TikTok** | File input is hidden; must call `inputFile.style.display = 'block'` before `setInputFiles`. |
| **TikTok** | Only 5-minute time intervals are supported in the picker; minutes are auto-rounded up. |
| **Instagram/Facebook posts** | Both platforms share one bot (`InstaFbPostScheduler`) via Meta Business Suite. The "deselect other platform" logic is intentionally inverted. |
| **YouTube** | `set_time` must be supplied in 12-hour AM/PM format (`"2:30 PM"`) — the bot does not convert. All other bots accept 24-hour. |
| **OnlyFans** | Local `Schedule.media_path` is typed as `string[]` but is actually `MediaPath[]` at runtime — the `isPaid` filter relies on this. |
| **OnlyFans** | Both OF bots (post + mass message) share nearly identical date/time/media upload code — keep them in sync when fixing selector bugs. |
| **All bots** | `patchright` persistent context sets `process.env.HOME = userDir` before launch so Chrome's profile directory lookup resolves correctly. |
