import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";

declare global {
  interface Window {
    __ARC_WEB_VITALS__?: Metric[];
  }
}

const shouldLogToConsole = import.meta.env.DEV;

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
}

export function reportWebVitals() {
  onCLS(recordMetric);
  onFCP(recordMetric);
  onINP(recordMetric);
  onLCP(recordMetric);
  onTTFB(recordMetric);
}
