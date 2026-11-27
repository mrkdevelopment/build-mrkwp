// The Worker: Astro answers requests, and once a minute the outbox is sent.
import { handle } from '@astrojs/cloudflare/handler';
import { drain } from './lib/outbox.ts';

export default {
  fetch: (request, env, ctx) => handle(request, env, ctx),
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(drain(env));
  },
} satisfies ExportedHandler<Env>;
