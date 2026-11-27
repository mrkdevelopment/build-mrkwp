// Website rebuild: which screen a job shows at each stage.
// The stages themselves are set by mrkdevelopment.net (section 2 of REBUILD-SPEC-1-MRKWP-CORE.md).

/** The five steps on the www.mrkwp.com/website-rebuilds/ page. */
export const STEPS = ['Sign up', 'Your business', 'Five designs', 'Pick and pay', 'Go live'];

export interface StageScreen {
  /** How many of the five steps are finished. The next one is the step the client is on. */
  done: number;
  /** `welcome` has its own screen. The rest show a heading and a few plain lines until their screens are built. */
  screen: 'welcome' | 'message';
  heading: string;
  /** The part of the heading shown in blue. */
  payoff: string;
  text: string;
}

const soon = "We'll email you as soon as there's something for you to do. You can close this page.";

export const STAGES: Record<string, StageScreen> = {
  signed_up: { done: 1, screen: 'welcome', heading: '', payoff: '', text: '' },
  confirmed: { done: 1, screen: 'message', heading: "You're in.", payoff: 'Your next step is on its way.', text: "Next we'll ask about your business and take a look at your current website. That step is being finished now, and we'll email you the moment it's ready. You don't need to do anything until then." },
  not_a_fit: { done: 1, screen: 'message', heading: 'This one', payoff: 'needs a conversation.', text: "Your website needs a closer look than our automatic checks can give it. We'll be in touch by email to set up a free 20-minute call." },
  ready: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs come next.', text: soon },
  claimed: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs come next.', text: soon },
  designing: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs are being made.', text: soon },
  designs_received: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs are being made.', text: soon },
  designs_ready: { done: 2, screen: 'message', heading: 'Your five designs', payoff: 'are ready.', text: "We're getting them ready to show you here. " + soon },
  ranked: { done: 3, screen: 'message', heading: 'Thanks for choosing.', payoff: "We're working out your price.", text: soon },
  priced: { done: 3, screen: 'message', heading: 'Your price', payoff: 'is ready.', text: "We're getting it ready to show you here. " + soon },
  paid: { done: 4, screen: 'message', heading: 'Thank you.', payoff: 'Your build has started.', text: soon },
  building: { done: 4, screen: 'message', heading: 'Thank you.', payoff: 'Your build has started.', text: soon },
  demo_ready: { done: 4, screen: 'message', heading: 'Your demo', payoff: 'is ready.', text: "We're getting it ready to show you here. " + soon },
  changes_requested: { done: 4, screen: 'message', heading: 'Got it.', payoff: "We're making your changes.", text: soon },
  approved: { done: 4, screen: 'message', heading: 'Approved.', payoff: "You're nearly live.", text: "We'll email you the last steps for your domain." },
  live: { done: 5, screen: 'message', heading: 'Congratulations.', payoff: "You're live.", text: 'Your new website is up. Thank you for building it with us.' },
  closed: { done: 0, screen: 'message', heading: 'This job', payoff: 'is closed.', text: 'If you think that is a mistake, get in touch and we will sort it out.' },
};

/** A stage this app doesn't know yet still gets a calm screen. */
export const UNKNOWN_STAGE: StageScreen = { done: 0, screen: 'message', heading: "We're working", payoff: 'on your job.', text: soon };
