import { UsageReport } from './types';

export async function sendDiscordReport(webhookUrl: string, report: UsageReport, isEmergency: boolean = false) {
  const embed = {
    title: isEmergency ? '🚨 EMERGENCY - Drifter Kill Switch Engaged' : '🏮 Drifter - Weekly Cloudflare Report',
    description: isEmergency 
      ? `Usage limit exceeded in the last 24h! **System Disabling Triggered.**`
      : `Usage summary for **${report.startDate}** to **${report.endDate}**`,
    color: isEmergency ? 0xff0000 : 0x5865f2, // Red for emergency, Blurple for report
    fields: [
      {
        name: '⚡ Workers',
        value: `**Requests:** ${report.workers.requests.toLocaleString()}\n**Avg CPU:** ${report.workers.cpuTimeAvg.toFixed(2)}ms`,
        inline: true,
      },
      {
        name: '📦 KV Storage',
        value: `**Reads:** ${report.kv.reads.toLocaleString()}\n**Writes:** ${report.kv.writes.toLocaleString()}`,
        inline: true,
      },
      {
        name: '🗄️ D1 Database',
        value: `**Reads:** ${report.d1?.rowsRead.toLocaleString()}\n**Writes:** ${report.d1?.rowsWritten.toLocaleString()}`,
        inline: true,
      },
    ],
    footer: {
      text: 'Stay driftin\' within the free tier.',
    },
    timestamp: new Date().toISOString(),
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord Webhook failed: ${response.status}`);
  }
}
