export const VITAL_NAMES = ['CLS', 'FCP', 'INP', 'LCP', 'TTFB'] as const;
type VitalName = (typeof VITAL_NAMES)[number];

// Bounded ring buffer per metric so memory doesn't grow unboundedly with
// traffic — recent samples are what matter for a live percentile view.
const MAX_SAMPLES_PER_VITAL = 500;
const samples = new Map<VitalName, number[]>();

export function recordVital(name: VitalName, value: number): void {
  const values = samples.get(name) ?? [];
  values.push(value);
  if (values.length > MAX_SAMPLES_PER_VITAL) {
    values.shift();
  }
  samples.set(name, values);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[index];
}

export function getVitalsSnapshot() {
  const vitals: Record<string, { count: number; p50: number; p75: number; p95: number }> = {};

  for (const name of VITAL_NAMES) {
    const values = samples.get(name) ?? [];
    const sorted = [...values].sort((a, b) => a - b);
    vitals[name] = {
      count: sorted.length,
      p50: percentile(sorted, 50),
      p75: percentile(sorted, 75),
      p95: percentile(sorted, 95),
    };
  }

  return { vitals };
}
