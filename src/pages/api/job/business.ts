// Every button on the "Your business" screens posts here. The answer is always "go back to your
// job": the job page then shows whichever screen the saved answers lead to.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { businessAction } from '../../../lib/business-actions.ts';
import { signedInNumber } from '../../../lib/open-job.ts';
import { getJob } from '../../../lib/store.ts';

export const POST: APIRoute = async ({ cookies, locals, redirect, request }) => {
  const number = await signedInNumber(env, cookies);
  const row = number ? await getJob(env.DB, number) : null;
  if (!row) return new Response('Please open the link in your email again.', { status: 403 });

  const form = await request.formData().catch(() => null);
  // These screens only exist while the job is at "confirmed". Anything else is a stale page.
  if (form && row.stage === 'confirmed') {
    await businessAction(env, row, form, (work) => locals.cfContext.waitUntil(work));
  }
  // Typing saved in the background needs no page in reply.
  if (form?.get('do') === 'keep') return new Response(null, { status: 204 });
  return redirect(`/${row.product}/${row.number}`, 303);
};
