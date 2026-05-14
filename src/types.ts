export interface UsageReport {
  workers: {
    requests: number;
    cpuTimeAvg: number;
  };
  kv: {
    reads: number;
    writes: number;
  };
  d1?: {
    rowsRead: number;
    rowsWritten: number;
  };
  r2?: {
    classA: number; // Writes, deletes
    classB: number; // Reads
  };
  startDate: string;
  endDate: string;
}

export interface CloudflareBindings {
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  DISCORD_WEBHOOK_URL: string;
  DRIFTER_CONTROL: KVNamespace;
}

// Cloudflare Free Tier Limits (Daily/Monthly aggregated)
export const FREE_TIER_LIMITS = {
  workers: {
    requests: 100_000, // Daily limit
  },
  kv: {
    reads: 50_000, // Daily limit
    writes: 5_000, // Daily limit
  },
  d1: {
    rowsRead: 833_333, // Daily budget (approx 1/30th of 25m/month)
    rowsWritten: 50_000, // Monthly limit is 100k, so we kill at 50% to be safe
  },
};
