# 🏮 Drifter

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cntrvsy/drifter)

Drifter is your personal **Cloudflare Workers guardian**. It's a proactive monitoring tool designed to keep your hobby projects and small backends within the specified limits. By watching your usage like a hawk, it can automatically trip a "kill switch" (circuit breaker) to prevent unexpected billing surprises.

---

## ✨ Why Drifter?

If you've ever worried about a project going viral (for the wrong reasons) or a recursive loop eating your budget, Drifter is for you. It provides:

- **Hourly Usage Checks**: Automatically monitors your account metrics via Cloudflare's GraphQL API.
- **Circuit Breaker Pattern**: A shared KV state that your other Workers can check to instantly stop processing requests if limits are breached.
- **Discord Notifications**: Instant alerts when a limit is reached or when the kill switch is engaged.

---

## 🛠️ Prerequisites

Before you get started, you'll need:

1.  **A Cloudflare Account**: Obviously!
2.  **A Discord Webhook**: This is where Drifter will send its alerts. [Follow this guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks) to create one in your preferred channel.
3.  **A Cloudflare API Token**: You'll need a token with permissions to read your account usage.
    - Go to **My Profile > API Tokens**.
    - Create a token with **Account: Read** permissions (specifically for Analytics/Usage).

---

## 🚀 Getting Started

### 1. Repository Setup

We use a "dual-config" system so you can contribute to the code without accidentally leaking your private IDs:

- **`wrangler.toml`**: The public template used by the "Deploy" button.
- **`wrangler.jsonc`**: Your personal configuration (gitignored).

Start by creating your local config:

```bash
cp wrangler.toml wrangler.jsonc
```

### 2. Provisioning Resources

Drifter needs a place to store the "Kill Switch" state. Create a KV Namespace:

```bash
npx wrangler kv:namespace create DRIFTER_CONTROL
```

**Next Step**: Copy the `id` from the command output and paste it into the `kv_namespaces` section of your `wrangler.jsonc`. Also, add your `CLOUDFLARE_ACCOUNT_ID`.

### 3. Securing Your Secrets

We never store tokens in plain text. Use Wrangler to upload your sensitive credentials securely to Cloudflare's encrypted secret store:

```bash
# Your API Token from the Prerequisites step
npx wrangler secret put CLOUDFLARE_API_TOKEN

# The Discord Webhook URL you created earlier
npx wrangler secret put DISCORD_WEBHOOK_URL
```

### 4. Local Testing

For local development, create a `.dev.vars` file (which is also gitignored) to store your secrets temporarily:

```env
CLOUDFLARE_API_TOKEN="your-secret-token"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### 5. Deployment

When you're ready to set the guardian live:

```bash
npm run deploy
```

---

## 🛡️ Protecting Your Other Projects

To make the kill switch actually _work_, your other Workers need to check the "Gatekeeper".

### 1. Connect the KV Binding

In your **other** Worker's configuration (`wrangler.toml`), bind the same KV namespace you created for Drifter:

```toml
[[kv_namespaces]]
binding = "DRIFTER_CONTROL"
id = "YOUR_SHARED_KV_NAMESPACE_ID"
```

### 2. Add the Gatekeeper Snippet

Add this small check at the very beginning of your `fetch` handler. It's lightweight and ensures that if Drifter trips the switch, this Worker stops immediately.

```typescript
export default {
  async fetch(request, env, ctx) {
    // Check if the guardian has tripped the kill switch
    const isDisabled = await env.DRIFTER_CONTROL.get("DISABLED");

    if (isDisabled === "true") {
      return new Response(
        "Service Temporarily Unavailable (Usage Limit Reached)",
        {
          status: 503,
          headers: { "Retry-After": "3600" },
        },
      );
    }

    // Your actual application logic goes here...
    return new Response("Hello World!");
  },
};
```

---

## 🛠️ Operations & Maintenance

### How to Reset (Un-Kill)

If you've resolved the usage issue or upgraded your plan and want to re-enable your services:

```bash
npx wrangler kv:key delete --binding=DRIFTER_CONTROL "DISABLED"
```

### Manual Usage Report

Want to see where you stand right now? Visit:
`https://drifter.<your-subdomain>.workers.dev/test-report`

---

## 📖 Built With

- [Hono](https://hono.dev/) - The ultra-fast web framework for the edge.
- [Cloudflare GraphQL API](https://developers.cloudflare.com/analytics/graphql-api/) - For precise account-level monitoring.
- [Cloudflare KV](https://developers.cloudflare.com/kv/) - Low-latency state management.

---

## 💡 Inspiration & Credits

This project was inspired by the excellent work and discussion in this blog post: [Automating Cloudflare Workers Kill Switch](https://pizzaconsole.com/blog/posts/programming/cf-overage).
