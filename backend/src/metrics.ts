import { Request } from 'express';

interface RouteStats {
  total: number;
  statusClassCounts: Record<'2xx' | '3xx' | '4xx' | '5xx', number>;
}

const startedAt = Date.now();
let totalRequests = 0;
const totalStatusClassCounts: RouteStats['statusClassCounts'] = {
  '2xx': 0,
  '3xx': 0,
  '4xx': 0,
  '5xx': 0,
};
const routeStats = new Map<string, RouteStats>();

function statusClass(statusCode: number): keyof RouteStats['statusClassCounts'] {
  if (statusCode >= 500) return '5xx';
  if (statusCode >= 400) return '4xx';
  if (statusCode >= 300) return '3xx';
  return '2xx';
}

// req.route is only populated once Express has matched a route, so a 404 or
// a request that errors before routing falls back to a fixed per-method
// bucket instead of the raw path — otherwise arbitrary/malicious paths would
// grow this map without bound.
function routeKey(req: Request): string {
  const pattern = req.route?.path;
  const path = pattern
    ? `${req.baseUrl}${pattern === '/' ? '' : pattern}` || '/'
    : 'unmatched';
  return `${req.method} ${path}`;
}

export function recordRequest(req: Request, statusCode: number): void {
  const cls = statusClass(statusCode);
  totalRequests++;
  totalStatusClassCounts[cls]++;

  const key = routeKey(req);
  const stats = routeStats.get(key) ?? {
    total: 0,
    statusClassCounts: { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0 },
  };
  stats.total++;
  stats.statusClassCounts[cls]++;
  routeStats.set(key, stats);
}

function errorRate(counts: RouteStats['statusClassCounts'], total: number): number {
  if (total === 0) return 0;
  return (counts['4xx'] + counts['5xx']) / total;
}

export function getMetricsSnapshot() {
  const routes = Array.from(routeStats.entries())
    .map(([route, stats]) => ({
      route,
      total: stats.total,
      statusClassCounts: stats.statusClassCounts,
      errorRate: errorRate(stats.statusClassCounts, stats.total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    totalRequests,
    statusClassCounts: totalStatusClassCounts,
    errorRate: errorRate(totalStatusClassCounts, totalRequests),
    routes,
  };
}
