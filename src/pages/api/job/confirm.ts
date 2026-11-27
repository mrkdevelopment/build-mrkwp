// The Start button on the welcome screen: the client has opened their link and wants to go on.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { signedInNumber } from '../../../lib/open-job.ts';
import { drain } from '../../../lib/outbox.ts';
import { getJob, recordAction } from '../../../lib/store.ts';

export const POST: APIRoute = async ({ cookies, locals, redirect }) => {
  const number = await signedInNumber(env, cookies);
  const row = number ? await getJob(env.DB, number) : null;
  if (!row) return new Response('Please open the link in your email again.', { status: 403 });

  // Pressing Start twice, or going back and pressing it again, changes nothing.
  if (row.stage === 'signed_up') {
    await recordAction(env.DB, row, 'confirm', {}, 'confirmed');
    // Try to send it straight away; the one-minute worker picks it up if this doesn't get through.
    locals.cfContext.waitUntil(drain(env, row.number));
  }
  return redirect(`/${row.product}/${row.number}`, 303);
};
