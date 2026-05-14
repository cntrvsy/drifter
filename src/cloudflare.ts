import { CloudflareBindings, UsageReport } from './types';
import { USAGE_QUERY } from './queries';

export async function fetchUsageReport(env: CloudflareBindings, days: number = 7): Promise<UsageReport> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
    },
    body: JSON.stringify({
      query: USAGE_QUERY,
      variables: {
        accountTag: env.CLOUDFLARE_ACCOUNT_ID,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} - ${errorBody}`);
  }

  const result: any = await response.json();

  if (result.errors) {
    throw new Error(`Cloudflare GraphQL Error: ${JSON.stringify(result.errors)}`);
  }

  if (!result.data?.viewer?.accounts?.length) {
    throw new Error('No account data found. Please check your CLOUDFLARE_ACCOUNT_ID and API Token permissions.');
  }

  const data = result.data.viewer.accounts[0];

  const workers = data.workers[0] || { sum: { requests: 0 }, quantiles: { cpuTimeP50: 0 } };
  
  // KV Breakdown logic
  let kvReads = 0;
  let kvWrites = 0;
  if (data.kv) {
    data.kv.forEach((group: any) => {
      const type = group.dimensions.actionType;
      const count = group.sum.requests;
      if (type === 'read' || type === 'list') kvReads += count;
      if (type === 'write' || type === 'delete') kvWrites += count;
    });
  }

  const d1 = data.d1[0]?.sum || { rowsRead: 0, rowsWritten: 0 };

  return {
    workers: {
      requests: workers.sum.requests,
      cpuTimeAvg: workers.quantiles.cpuTimeP50 || 0,
    },
    kv: {
      reads: kvReads,
      writes: kvWrites,
    },
    d1: {
      rowsRead: d1.rowsRead,
      rowsWritten: d1.rowsWritten,
    },
    startDate: startDate.toLocaleDateString(),
    endDate: endDate.toLocaleDateString(),
  };
}
