import { Page } from 'patchright'

interface MediaPath { filePath: string; previewUrl: string; isPaid: boolean }

interface Schedule {
  id: string
  Instance_id: string
  description_type: string
  city: string
  isScheduled: number
  description_text: string
  signature: string
  set_price: number
  set_date: string
  created_at: number
  set_time: string
  media_path: MediaPath[]
  platform: string
}

async function TwitterPostScheduler(
  page: Page,
  schedules: Schedule[],
  jsonFilePath: string,
  moveToHistory: (id: string, path: string) => void
): Promise<void> {
  for (const schedule of schedules) {
    if (schedule.isScheduled !== 0) continue

    try {
      const { set_date, set_time, description_text, signature } = schedule
      const media_path = schedule.media_path.map(f => f.filePath)

      // Parse date — "2026-06-30" → month="6", day="30", year="2026"
      const [year, monthStr, dayStr] = set_date.split('-')
      const monthNum = String(+monthStr)   // strip leading zero: "06" → "6"
      const dayNum   = String(+dayStr)     // strip leading zero: "09" → "9"

      // Parse time — "14:00" → hour="14", minute="0" (24-hour, numeric, no leading zero)
      const [hourStr, minuteStr] = set_time.split(':')
      const hourNum   = String(+hourStr)
      const minuteNum = String(+minuteStr)

      // 1. Navigate to home
      await page.goto('https://x.com/home', { timeout: 0 })

      // 2. Click compose area to activate the toolbar
      await page.waitForSelector('[data-testid="tweetTextarea_0"]', { timeout: 30000 })
      await page.click('[data-testid="tweetTextarea_0"]')
      await page.waitForTimeout(500)

      // 3. Type description + signature
      const fullText = signature ? `${description_text}\n${signature}` : description_text
      await page.type('[data-testid="tweetTextarea_0"]', fullText, { delay: 20 })

      // 4. Upload media (if any)
      if (media_path.length > 0) {
        await page.waitForSelector('[data-testid="fileInput"]', { timeout: 10000 })
        await page.setInputFiles('[data-testid="fileInput"]', media_path)
        // Wait for at least one attachment thumbnail to confirm the upload started
        await page.waitForSelector('[data-testid="attachments"]', { timeout: 30000 })
        console.log(`Twitter: ${media_path.length} file(s) uploading for schedule ${schedule.id}`)
      }

      // Wait for any upload progress to complete (video uploads can take minutes).
      // Can't use waitForFunction — Twitter's CSP blocks the eval it uses internally.
      for (let i = 0; i < 60; i++) {
        const uploading = await page.evaluate(() =>
          document.body.innerText.toLowerCase().includes('uploading')
        )
        if (!uploading) break
        await page.waitForTimeout(2000)
      }

      // Re-focus the compose area (video upload can cause it to lose focus/toolbar state)
      await page.click('[data-testid="tweetTextarea_0"]', { force: true })
      await page.waitForTimeout(500)

      // 5. Open schedule picker
      //    Use dispatchEvent — #layers overlay intercepts Playwright's native click.
      //    After the click, wait 2s for React to render the picker, then verify via evaluate
      //    (can't use waitForFunction/waitForSelector — Twitter's CSP blocks eval injection).
      //    Retry once if the picker didn't open (e.g. compose lost focus after video upload).
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="scheduleOption"]') as HTMLElement | null
        if (!btn) throw new Error('scheduleOption not found')
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
      })
      await page.waitForTimeout(2000)
      const pickerOpen = await page.evaluate(() =>
        document.getElementById('layers')?.innerText?.includes('Confirm') ?? false
      )
      if (!pickerOpen) {
        await page.evaluate(() => {
          document.querySelector('[data-testid="tweetTextarea_0"]')
            ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
        })
        await page.waitForTimeout(500)
        await page.evaluate(() => {
          const btn = document.querySelector('[data-testid="scheduleOption"]') as HTMLElement | null
          if (!btn) throw new Error('scheduleOption not found on retry')
          btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
        })
        await page.waitForTimeout(2000)
      }

      // 6. Fill date/time
      //    Twitter uses native <select> elements named SELECTOR_1..5
      //    All values are plain numbers — no text labels, no AM/PM, 24-hour clock
      // Fill via JS — the picker renders in #layers and Playwright's CSS selector
      // engine can't resolve elements there; getElementById works fine.
      await page.evaluate(([m, d, y, h, mn]: string[]) => {
        const setSelect = (id: string, val: string) => {
          const el = document.getElementById(id) as HTMLSelectElement | null
          if (!el) throw new Error(id + ' not found')
          el.value = val
          el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        setSelect('SELECTOR_1', m)   // Month (1-12)
        setSelect('SELECTOR_2', d)   // Day   (1-31)
        setSelect('SELECTOR_3', y)   // Year
        setSelect('SELECTOR_4', h)   // Hour  (0-23)
        setSelect('SELECTOR_5', mn)  // Minute (0-59)
      }, [monthNum, dayNum, year, hourNum, minuteNum])
      await page.waitForTimeout(5000)

      // 7. Confirm — inside #layers, same overlay issue; use dispatchEvent
      await page.evaluate(() => {
        const confirm = Array.from(document.querySelectorAll('*')).find(
          (el) => (el as HTMLElement).innerText?.trim() === 'Confirm'
        )
        if (!confirm) throw new Error('Confirm button not found')
        confirm.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
      })
      await page.waitForTimeout(500)

      // 8. Wait for submit button to become active, then click via dispatchEvent
      await page.waitForSelector(
        'xpath=//*[@data-testid="tweetButtonInline" and not(@aria-disabled)]',
        { timeout: 0 }
      )
      await page.evaluate(() => {
        const btn = document.querySelector('[data-testid="tweetButtonInline"]:not([aria-disabled])') as HTMLElement | null
        if (!btn) throw new Error('tweetButtonInline not found')
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
      })

      await page.waitForTimeout(3000)
      moveToHistory(schedule.id, jsonFilePath)
      console.log(`Twitter schedule complete: ${schedule.id}`)

    } catch (error) {
      console.error(`Twitter scheduler failed for schedule ${schedule.id}:`, error)
      throw error
    }
  }
}

export { TwitterPostScheduler }
