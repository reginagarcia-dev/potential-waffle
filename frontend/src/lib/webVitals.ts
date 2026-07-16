import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { BASE_URL } from "./api";

declare global {
  interface Window {
    __ARC_WEB_VITALS__?: Metric[];
  }
}

const shouldLogToConsole = import.meta.env.DEV;

// sendBeacon fires without blocking page unload (unlike fetch), which is
// the whole reason it exists for this use case — a metric captured right
// as the user navigates away must not delay that navigation. The payload
// is wrapped in a Blob with an explicit JSON content type because
// sendBeacon defaults a string payload to text/plain, which the backend's
// express.json() body parser won't parse.
function reportToBackend(metric: Metric) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) {
    return;
  }
  const payload = new Blob(
    [JSON.stringify({ name: metric.name, value: metric.value })],
    { type: "application/json" },
  );
  navigator.sendBeacon(`${BASE_URL}/vitals`, payload);
}

function recordMetric(metric: Metric) {
  if (typeof window === "undefined") {
    return;
  }

  window.__ARC_WEB_VITALS__ ??= [];
  window.__ARC_WEB_VITALS__.push(metric);

  if (shouldLogToConsole) {
    const value = metric.value.toFixed(metric.name === "CLS" ? 4 : 2);
    console.info(`[web-vitals] ${metric.name}: ${value}`, metric);
  }

  if (import.meta.env.PROD) {
    reportToBackend(metric);
  }
}

export function reportWebVitals() {
  onCLS(recordMetric);
  onFCP(recordMetric);
  onINP(recordMetric);
  onLCP(recordMetric);
  onTTFB(recordMetric);
}
