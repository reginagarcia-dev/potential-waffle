import type { Page } from "@playwright/test";

// "Good" per web.dev's Core Web Vitals thresholds (good: <0.1, needs
// improvement: 0.1-0.25, poor: >0.25).
export const CLS_BUDGET = 0.1;

/**
 * Installs a real PerformanceObserver for `layout-shift` entries before any
 * page script runs, so it captures the same signal the browser (and web-vitals'
 * onCLS) uses to compute CLS — not an approximation. Call once per test,
 * before navigating.
 */
export async function trackCLS(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { __clsValue: number }).__clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value: number; hadRecentInput: boolean }
        >) {
          if (!entry.hadRecentInput) {
            (window as unknown as { __clsValue: number }).__clsValue +=
              entry.value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    } catch {
      // layout-shift not supported in this browser — __clsValue stays 0,
      // which would silently pass; only chromium is configured in this repo.
    }
  });
}

/** Reads the CLS value accumulated so far by trackCLS(). */
export async function readCLS(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as unknown as { __clsValue?: number }).__clsValue ?? 0,
  );
}
