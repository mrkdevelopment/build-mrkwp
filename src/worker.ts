// The Worker: Astro answers requests, and once a minute the outbox is sent.
import { handle } from '@astrojs/cloudflare/handler';
import { reportNotFits } from './lib/business-actions.ts';
import { drain } from './lib/outbox.ts';

export default {
  fetch: (request, env, ctx) => handle(request, env, ctx),
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(reportNotFits(env).catch(() => {}).then(() => drain(env)));
  },
} satisfies ExportedHandler<Env>;
