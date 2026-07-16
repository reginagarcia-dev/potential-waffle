export const VITAL_NAMES = ['CLS', 'FCP', 'INP', 'LCP', 'TTFB'] as const;
type VitalName = (typeof VITAL_NAMES)[number];

export function isVitalName(name: unknown): name is VitalName {
  return typeof name === 'string' && (VITAL_NAMES as readonly string[]).includes(name);
}

// Fixed-size ring buffer per metric so memory doesn't grow unboundedly with
// traffic — recent samples are what matter for a live percentile view.
// writeIndex wraps via modulo instead of shift()ing the array, so a write
// is O(1) instead of re-indexing up to 500 elements on every insert once
// full. sortedCache is invalidated on write and recomputed lazily on the
// next read, since POST /vitals (writes) happens far more often than
// GET /vitals (reads) in the actual traffic pattern.
const MAX_SAMPLES_PER_VITAL = 500;

interface VitalBuffer {
  values: number[];
  writeIndex: number;
  count: number;
  sortedCache: number[] | null;
}

const buffers = new Map<VitalName, VitalBuffer>();

function getOrCreateBuffer(name: VitalName): VitalBuffer {
  let buffer = buffers.get(name);
  if (!buffer) {
    buffer = { values: [], writeIndex: 0, count: 0, sortedCache: null };
    buffers.set(name, buffer);
  }
  return buffer;
}

export function recordVital(name: VitalName, value: number): void {
  const buffer = getOrCreateBuffer(name);
  buffer.values[buffer.writeIndex] = value;
  buffer.writeIndex = (buffer.writeIndex + 1) % MAX_SAMPLES_PER_VITAL;
  buffer.count = Math.min(buffer.count + 1, MAX_SAMPLES_PER_VITAL);
  buffer.sortedCache = null;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[index];
}

function getSorted(buffer: VitalBuffer): number[] {
  if (!buffer.sortedCache) {
    buffer.sortedCache = buffer.values.slice(0, buffer.count).sort((a, b) => a - b);
  }
  return buffer.sortedCache;
}

export function getVitalsSnapshot() {
  const vitals: Record<string, { count: number; p50: number; p75: number; p95: number }> = {};

  for (const name of VITAL_NAMES) {
    const buffer = buffers.get(name);
    const sorted = buffer ? getSorted(buffer) : [];
    vitals[name] = {
      count: sorted.length,
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
    };
  }

  return { vitals };
}
