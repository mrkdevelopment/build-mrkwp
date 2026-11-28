// The questions asked before a client's design choices are sent. The first five tell the team what
// the website has to do behind the scenes, so they can cost it. The last asks whether the client
// wants to go over the design with Matt first. Nothing here touches the database or the network.

export interface Question {
  key: string;
  /** The question, in plain words. */
  ask: string;
  /** One quiet line under it, where the question needs it. */
  help?: string;
  options: { value: string; label: string }[];
}

export const QUESTIONS: Question[] = [
  {
    key: 'forms',
    ask: 'Do the enquiry forms on your current website work for your business?',
    options: [
      { value: 'work', label: 'Yes, they work well' },
      { value: 'could_be_better', label: 'They work, but could be better' },
      { value: 'dont_work', label: "No, they don't work" },
      { value: 'none', label: 'My website has no forms' },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    key: 'enquiries',
    ask: 'When someone sends an enquiry, where does it need to go?',
    help: 'A CRM is a system that keeps track of your customers and enquiries.',
    options: [
      { value: 'email', label: 'Just to my email' },
      { value: 'crm', label: 'Into a CRM or another system' },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    key: 'editing',
    ask: 'Do you want to update the website yourself?',
    help: 'Changing words and photos, adding news or new pages.',
    options: [
      { value: 'self_trained', label: "Yes, and I'd like training" },
      { value: 'self', label: "Yes, and I don't need training" },
      { value: 'mrk', label: "No, I'd like your team to make changes" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    key: 'support',
    ask: "Would you like ongoing support once it's live?",
    help: 'Updates, backups, fixes, and someone to call when you need a hand.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    key: 'technical',
    ask: 'If we ask you to change your domain settings or set up hosting, are you comfortable doing that?',
    help: "Either way, we'll never ask for your password.",
    options: [
      { value: 'self', label: 'Yes, I can do that myself' },
      { value: 'help', label: "No, I'd like your team to do it" },
      { value: 'unsure', label: "I'm not sure" },
    ],
  },
  {
    key: 'followup',
    ask: 'Would you like to go over your design with Matt before we get to the payment options?',
    help: 'A phone call or a Google Meet video call, to finalise the design together.',
    options: [
      { value: 'meet', label: 'Yes, a Google Meet video call' },
      { value: 'call', label: 'Yes, a phone call' },
      { value: 'none', label: 'No thanks, send me the costing' },
    ],
  },
];

/** The extra box under "Into a CRM or another system": which one. */
export const WHERE = 'enquiries_where';
/** The extra box under "Yes, a phone call": when is a good time. */
export const WHEN = 'followup_when';

/** What a client asked for after sending: a video meeting, a call back, or neither. */
export const followUpOf = (needs: Record<string, string>): { choice: 'meet' | 'call' | 'none'; when: string } => ({
  choice: needs.followup === 'meet' || needs.followup === 'call' ? needs.followup : 'none',
  when: needs.followup === 'call' ? (needs[WHEN] ?? '') : '',
});

/** Keeps only answers that are one of a question's options, plus the two short pieces of text. */
export function tidyNeeds(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const question of QUESTIONS) {
    const value = raw[question.key];
    if (typeof value === 'string' && question.options.some((option) => option.value === value)) out[question.key] = value;
  }
  for (const key of [WHERE, WHEN]) {
    const text = raw[key];
    if (typeof text === 'string') out[key] = text.replace(/\s+/g, ' ').trim().slice(0, 200);
  }
  return out;
}

/** Is every question answered? Returns a message for the client, or '' when they are. */
export function checkNeeds(needs: Record<string, string>): string {
  const missing = QUESTIONS.filter((question) => !needs[question.key]);
  if (missing.length === 0) return '';
  // The reminder that "I'm not sure" is fine only helps when a question left blank offers it.
  const hint = missing.some((question) => question.options.some((option) => option.value === 'unsure')) ? ' "I\'m not sure" is fine.' : '';
  return (missing.length === 1 ? 'One question still needs an answer.' : `${missing.length} questions still need an answer.`) + hint;
}

/** The answers as they are sent: every question's key, and each piece of text only when its answer applies. */
export function needsOf(needs: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const question of QUESTIONS) out[question.key] = needs[question.key] ?? '';
  out[WHERE] = needs.enquiries === 'crm' ? (needs[WHERE] ?? '') : '';
  out[WHEN] = needs.followup === 'call' ? (needs[WHEN] ?? '') : '';
  return out;
}
