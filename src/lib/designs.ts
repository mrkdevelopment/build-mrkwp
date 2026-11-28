// "Your five designs": reading the designs off a job, and checking a client's ranking.
// Nothing here touches the database or the network.

export interface Picture {
  url: string;
  width: number;
  height: number;
}

export interface Design {
  position: number;
  name: string;
  idea: string;
  notes: string;
  desktop: Picture | null;
  mobile: Picture | null;
}

/** What a client has said so far. A pick is 'like', 'dislike', or '' for not decided. */
export interface RankingDraft {
  picks: Record<string, string>;
  /** What they like about each design, by position. Any design can have one, whatever the pick. */
  likes: Record<string, string>;
  /** What they dislike about each design, by position. */
  dislikes: Record<string, string>;
  /** The designs they liked, in their order of preference: positions, first choice first. */
  rank: number[];
  /** Their mix-and-match notes across all the designs. */
  notes: string;
  /** Their answers to the costing questions (src/lib/needs.ts), by question. */
  needs: Record<string, string>;
  /** `pick` while they are choosing, `review` to check and order what they liked, `needs` for the costing questions. */
  step: 'pick' | 'review' | 'needs';
  /** When their choices were last sent, or '' if they haven't been. */
  sent_at: string;
  error: string;
}

export const newRanking = (): RankingDraft => ({ picks: {}, likes: {}, dislikes: {}, rank: [], notes: '', needs: {}, step: 'pick', sent_at: '', error: '' });

/** The saved choices, as a full record. (Before there were two notes per design, the one note was `comments`.) */
export function readRanking(saved: unknown): RankingDraft {
  const old = (saved && typeof saved === 'object' ? saved : {}) as Partial<RankingDraft> & { comments?: Record<string, string> };
  const fresh = newRanking();
  const rank = Array.isArray(old.rank) ? old.rank.filter((position) => Number.isInteger(position)) : [];
  return { ...fresh, ...old, picks: { ...old.picks }, likes: { ...old.comments, ...old.likes }, dislikes: { ...old.dislikes }, rank, needs: { ...old.needs } };
}

/** Which of the designs screens to show. */
export function designsScreen(draft: RankingDraft): 'pick' | 'review' | 'needs' | 'sent' {
  if (draft.sent_at !== '') return 'sent';
  return draft.step === 'review' || draft.step === 'needs' ? draft.step : 'pick';
}

const text = (value: unknown, max: number): string => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/**
 * A picture is only shown from the backend's own site (mrkdevelopment.net and its sub-domains), so
 * nothing on a job can point a client's browser somewhere else.
 */
function picture(value: unknown, home: URL): Picture | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Record<string, unknown>;
  try {
    const url = new URL(String(p.url ?? ''));
    const sameSite = url.hostname === home.hostname || url.hostname.endsWith('.' + home.hostname);
    if (!sameSite || url.protocol !== home.protocol || url.username || url.password) return null;
    const size = (n: unknown): number => (typeof n === 'number' && n > 0 && n < 20_000 ? Math.round(n) : 0);
    return { url: url.href, width: size(p.width), height: size(p.height) };
  } catch {
    return null;
  }
}

/** The designs on a job, in order, ready to show. `backend` is where mrkdevelopment.net answers. */
export function designsOf(raw: unknown, backend: string): Design[] {
  let home: URL;
  try {
    home = new URL(backend);
  } catch {
    return [];
  }
  const list = Array.isArray(raw) ? raw : [];
  const designs: Design[] = [];
  for (const item of list.slice(0, 5)) {
    if (!item || typeof item !== 'object') continue;
    const d = item as Record<string, unknown>;
    const position = typeof d.position === 'number' ? Math.round(d.position) : 0;
    if (position < 1 || position > 5 || designs.some((other) => other.position === position)) continue;
    designs.push({
      position,
      name: text(d.name, 80) || `Design ${position}`,
      idea: text(d.idea, 400),
      // The skill's notes can run to a long paragraph: keep them whole.
      notes: text(d.notes, 3000),
      desktop: picture(d.desktop, home),
      mobile: picture(d.mobile, home),
    });
  }
  return designs.sort((a, b) => a.position - b.position);
}

/** Keeps only picks that make sense for the designs on the job. */
export function tidyPicks(picks: Record<string, string>, designs: Design[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const design of designs) {
    const pick = picks[String(design.position)] ?? '';
    out[String(design.position)] = pick === 'like' || pick === 'dislike' ? pick : '';
  }
  return out;
}

/** Are these choices ready to send? Returns a message for the client, or '' when they are. */
export function checkRanking(picks: Record<string, string>, designs: Design[]): string {
  const liked = designs.some((design) => picks[String(design.position)] === 'like');
  return liked ? '' : 'Like at least one design, so we know which direction to build from. Open a design and press Like.';
}

/**
 * The liked designs in order of preference. `wanted` is the order asked for (or the one saved);
 * anything in it that isn't liked is dropped, and a design liked since then joins the end.
 */
export function rankOrder(wanted: number[], picks: Record<string, string>, designs: Design[]): number[] {
  const liked = designs.filter((design) => picks[String(design.position)] === 'like').map((design) => design.position);
  const kept = [...new Set(wanted)].filter((position) => liked.includes(position));
  return [...kept, ...liked.filter((position) => !kept.includes(position))];
}

/** Move one design a place up (-1) or down (+1) the order. At either end it stays where it is. */
export function moveInRank(rank: number[], position: number, by: -1 | 1): number[] {
  const from = rank.indexOf(position);
  const to = from + by;
  if (from < 0 || to < 0 || to >= rank.length) return rank;
  const next = [...rank];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export interface DesignFeedback {
  position: number;
  /** 'like', 'dislike', or '' when they wrote notes without choosing. */
  choice: string;
  /** What they like about this design. */
  likes: string;
  /** What they dislike about it. */
  dislikes: string;
}

/**
 * The client's choices in the shape mrkdevelopment.net keeps. `order` is the designs they liked,
 * first choice first: the first is the one to build from, the rest are to borrow from. `rejected`
 * is the ones they disliked. `feedback` has one entry for every design they chose on or wrote
 * about: the choice, what they like, and what they dislike. A liked design can still have dislikes.
 */
export function rankingOf(draft: RankingDraft, designs: Design[], now: string): { order: number[]; rejected: number[]; feedback: DesignFeedback[]; notes: string; ranked_at: string } {
  const pick = (design: Design): string => draft.picks[String(design.position)] ?? '';
  const feedback = designs
    .map((design) => ({ position: design.position, choice: pick(design), likes: draft.likes[String(design.position)] ?? '', dislikes: draft.dislikes[String(design.position)] ?? '' }))
    .filter((entry) => entry.choice !== '' || entry.likes !== '' || entry.dislikes !== '');
  return {
    order: rankOrder(draft.rank, draft.picks, designs),
    rejected: designs.filter((design) => pick(design) === 'dislike').map((design) => design.position),
    feedback,
    notes: draft.notes,
    ranked_at: now,
  };
}
