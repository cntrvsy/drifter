import { Hono } from 'hono';
import { CloudflareBindings, FREE_TIER_LIMITS } from './types';
import { fetchUsageReport } from './cloudflare';
import { sendDiscordReport } from './discord';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get('/', (c) => {
  return c.text('Drifter is active. Monitoring Cloudflare usage.');
});

// Manual trigger for testing
app.get('/test-report', async (c) => {
  try {
    const report = await fetchUsageReport(c.env);
    await sendDiscordReport(c.env.DISCORD_WEBHOOK_URL, report);
    return c.json({ success: true, message: 'Report sent to Discord!', report });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// The Cron Handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        try {
          // 1. Check for Emergency Kill Switch (Last 24h)
          const dailyReport = await fetchUsageReport(env, 1);
          const isOverLimit = 
            dailyReport.workers.requests >= FREE_TIER_LIMITS.workers.requests ||
            dailyReport.kv.reads >= FREE_TIER_LIMITS.kv.reads ||
            (dailyReport.d1 && dailyReport.d1.rowsRead >= FREE_TIER_LIMITS.d1.rowsRead);

          if (isOverLimit) {
            await env.DRIFTER_CONTROL.put('DISABLED', 'true');
            await sendDiscordReport(env.DISCORD_WEBHOOK_URL, dailyReport, true);
            console.error('CRITICAL: Usage limit exceeded. Kill switch engaged.');
            return;
          }

          // 2. Weekly Report (Monday at 9:00 AM)
          if (event.cron === '0 9 * * 1') {
            const weeklyReport = await fetchUsageReport(env, 7);
            await sendDiscordReport(env.DISCORD_WEBHOOK_URL, weeklyReport, false);
            console.log('Weekly report sent successfully.');
          }
        } catch (error) {
          console.error('Failed to process scheduled task:', error);
        }
      })()
    );
  },
};
