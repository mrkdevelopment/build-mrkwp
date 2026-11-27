// The only file that talks to mrkdevelopment.net (mrkwp-core's /build routes).
// The contract is REBUILD-SPEC-1-MRKWP-CORE.md, section 4, in the mrkwp.com site repository.

/** The client's view of a job, as the backend sends it. Empty parts arrive as `[]`. */
export interface Job {
  number: string;
  product: string;
  stage: string;
  created_at: string;
  first_name: string;
  /** The address typed on the sign-up form, or '' (mrkwp-core 1.8.2 and later). */
  website?: string;
  [part: string]: unknown;
}

export interface Answer {
  /** HTTP status, or 0 when mrkdevelopment.net could not be reached. */
  status: number;
  job?: Job;
  /** The backend's error code, e.g. `mrkwp_build_action`. */
  code?: string;
}

export async function callJob(
  env: Env,
  method: 'GET' | 'PATCH',
  number: string,
  code: string,
  options: { body?: unknown; idempotencyKey?: string; timeoutMs?: number } = {},
): Promise<Answer> {
  const headers: Record<string, string> = {
    Authorization: 'Basic ' + btoa(`${env.BUILD_API_USER}:${env.BUILD_API_PASSWORD}`),
    'User-Agent': env.WP_USER_AGENT,
    'X-Job-Token': code,
    Accept: 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  try {
    const response = await fetch(`${env.BUILD_API_URL}/jobs/${number}`, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
    });
    const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (response.ok && data && typeof data.number === 'string' && typeof data.stage === 'string') {
      return { status: response.status, job: data as Job };
    }
    // A 200 that isn't a job (a firewall page, say) is treated as "couldn't reach it".
    return { status: response.ok ? 0 : response.status, code: typeof data?.code === 'string' ? data.code : undefined };
  } catch {
    return { status: 0 };
  }
}
