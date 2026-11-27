// A stand-in for mrkdevelopment.net, for testing this app with no real client data and for
// rehearsing an outage. It answers the way mrkwp-core 1.8.1 does (docs/START-HERE.md).
//
//   node tests/fake-backend.mjs            then, in another terminal:   npm run dev:test
//   Job:  http://localhost:4321/rebuild/RB-9001?k=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//   curl -X POST localhost:8799/_control -d '{"down":true}'      pretend the backend is unreachable
//   curl -X POST localhost:8799/_control -d '{"stage":"paid"}'   move the job to any stage
//   curl localhost:8799/_control                                  what this app has sent so far
import { createServer } from 'node:http';

const CODE = 'A'.repeat(43);
const job = {
  number: 'RB-9001', product: 'rebuild', stage: 'signed_up', created_at: '2026-11-27T01:00:00Z', first_name: 'Sam',
  business: [], scan: [], goals: '', designs: [], ranking: [], extras: [], price: [], demo: [],
};
let down = false;
const calls = [];

const send = (res, status, body) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
const read = async (req) => { let text = ''; for await (const chunk of req) text += chunk; return text ? JSON.parse(text) : {}; };

createServer(async (req, res) => {
  if (req.url === '/_control') {
    if (req.method === 'POST') { const body = await read(req); if ('down' in body) down = body.down; if (body.stage) job.stage = body.stage; }
    return send(res, 200, { down, stage: job.stage, calls });
  }
  if (down) return send(res, 503, { code: 'down' });
  if (req.headers.authorization !== 'Basic ' + btoa('test:test')) return send(res, 401, { code: 'rest_forbidden' });
  const number = req.url.match(/^\/build\/jobs\/([A-Za-z]{2}-\d{4,})$/)?.[1]?.toUpperCase();
  if (number !== job.number || req.headers['x-job-token'] !== CODE) return send(res, 404, { code: 'mrkwp_build_not_found' });
  if (req.method === 'PATCH') {
    const body = await read(req);
    calls.push({ action: body.action, key: req.headers['idempotency-key'] });
    if (body.action !== 'confirm') return send(res, 400, { code: 'mrkwp_build_action' });
    if (job.stage === 'signed_up') job.stage = 'confirmed';
  }
  send(res, 200, job);
}).listen(8799, () => console.log('Stand-in backend on http://localhost:8799'));
