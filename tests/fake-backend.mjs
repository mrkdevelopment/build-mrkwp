// A stand-in for mrkdevelopment.net, for testing this app with no real client data and for
// rehearsing an outage. It answers the way mrkwp-core 1.8.2 does (docs/START-HERE.md).
//
//   node tests/fake-backend.mjs            then, in another terminal:   npm run dev:test
//   Job:  http://localhost:4321/rebuild/RB-9001?k=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//   curl -X POST localhost:8799/_control -d '{"down":true}'      pretend the backend is unreachable
//   curl -X POST localhost:8799/_control -d '{"stage":"paid"}'   move the job to any stage
//   curl -X POST localhost:8799/_control -d '{"accept":true}'  pretend the backend already takes "details" and "goals"
//   curl -X POST localhost:8799/_control -d '{"website":"https://example.com"}'  the address typed at sign-up
//   curl -X POST localhost:8799/_control -d '{"designs":true}'  give the job five designs and move it to designs_ready
//   curl localhost:8799/_control                                  what this app has sent so far
import { createServer } from 'node:http';

const CODE = 'A'.repeat(43);
const job = {
  number: 'RB-9001', product: 'rebuild', stage: 'signed_up', created_at: '2026-11-27T01:00:00Z', first_name: 'Sam', website: '',
  business: [], scan: [], goals: '', designs: [], ranking: [], extras: [], price: [], demo: [],
};
let down = false;
let accept = false; // true: behave like a later backend that takes "details" and "goals"
const calls = [];

const send = (res, status, body) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
const read = async (req) => { let text = ''; for await (const chunk of req) text += chunk; return text ? JSON.parse(text) : {}; };

// Five made-up designs. Their pictures are drawn here, so nothing real is needed.
const NAMES = ['Workshop', 'Clear Day', 'Local Hero', 'Night Shift', 'Field Notes'];
const COLOURS = ['#0A2540', '#0F766E', '#B45309', '#312E81', '#3F6212'];
const madeUpDesigns = () => NAMES.map((name, i) => ({
  position: i + 1, name, idea: `A ${['bold', 'calm', 'friendly', 'dark', 'editorial'][i]} take that leads with what you do and how to reach you.`,
  notes: i === 0 ? 'Uses your existing logo and photos.' : '',
  desktop: { url: `http://localhost:8799/pictures/${i + 1}-desktop.svg`, width: 1440, height: 2200 },
  mobile: { url: `http://localhost:8799/pictures/${i + 1}-mobile.svg`, width: 390, height: 1500 },
}));
const drawing = (position, view) => {
  const [w, h] = view === 'mobile' ? [390, 1500] : [1440, 2200];
  const c = COLOURS[position - 1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#F8FAFC"/><rect width="${w}" height="${h * 0.32}" fill="${c}"/>`
    + `<text x="${w * 0.06}" y="${h * 0.14}" fill="#fff" font-family="sans-serif" font-weight="700" font-size="${w * 0.07}">${NAMES[position - 1]}</text>`
    + `<rect x="${w * 0.06}" y="${h * 0.19}" width="${w * 0.3}" height="${h * 0.035}" rx="${w * 0.01}" fill="#fff"/>`
    + [0, 1, 2].map((n) => `<rect x="${w * 0.06}" y="${h * (0.38 + n * 0.2)}" width="${w * 0.88}" height="${h * 0.16}" rx="${w * 0.015}" fill="#E2E8F0"/>`).join('') + '</svg>';
};

createServer(async (req, res) => {
  const pic = req.url.match(/^\/pictures\/([1-5])-(desktop|mobile)\.svg$/);
  if (pic) return res.writeHead(200, { 'Content-Type': 'image/svg+xml' }).end(drawing(Number(pic[1]), pic[2]));
  if (req.url === '/_control') {
    if (req.method === 'POST') { const body = await read(req); if ('down' in body) down = body.down; if (body.stage) job.stage = body.stage; if ('accept' in body) accept = body.accept; if ('website' in body) job.website = body.website; if (body.designs) { job.designs = madeUpDesigns(); job.stage = 'designs_ready'; } }
    return send(res, 200, { down, stage: job.stage, calls });
  }
  if (down) return send(res, 503, { code: 'down' });
  if (req.headers.authorization !== 'Basic ' + btoa('test:test')) return send(res, 401, { code: 'rest_forbidden' });
  const number = req.url.match(/^\/build\/jobs\/([A-Za-z]{2}-\d{4,})$/)?.[1]?.toUpperCase();
  if (number !== job.number || req.headers['x-job-token'] !== CODE) return send(res, 404, { code: 'mrkwp_build_not_found' });
  if (req.method === 'PATCH') {
    const body = await read(req);
    calls.push({ action: body.action, key: req.headers['idempotency-key'] });
    if (body.action === 'confirm') { if (job.stage === 'signed_up') job.stage = 'confirmed'; }
    else if (accept && body.action === 'details') { job.business = body.business; job.scan = body.scan; if (body.scan?.fit === 'no') job.stage = 'not_a_fit'; }
    else if (accept && body.action === 'ranking') { job.ranking = body.ranking; job.needs = body.needs; if (job.stage === 'designs_ready') job.stage = 'ranked'; }
    else if (accept && body.action === 'goals') { job.goals = body.goals; if (job.stage === 'confirmed') job.stage = 'ready'; }
    else return send(res, 400, { code: 'mrkwp_build_action' });
  }
  send(res, 200, job);
}).listen(8799, () => console.log('Stand-in backend on http://localhost:8799'));
