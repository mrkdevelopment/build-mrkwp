// Website rebuild: which screen a job shows at each stage.
// The stages themselves are set by mrkdevelopment.net (section 2 of REBUILD-SPEC-1-MRKWP-CORE.md).

/** The five steps on the www.mrkwp.com/website-rebuilds/ page. */
export const STEPS = ['Sign up', 'Your business', 'Five designs', 'Pick and pay', 'Go live'];

export interface StageScreen {
  /** How many of the five steps are finished. The next one is the step the client is on. */
  done: number;
  /**
   * `welcome`, `business` (the "Your business" screens), `not_a_fit` and `designs` have their own screens.
   * The rest show a heading and a few plain lines until their screens are built.
   */
  screen: 'welcome' | 'business' | 'not_a_fit' | 'designs' | 'message';
  heading: string;
  /** The part of the heading shown in blue. */
  payoff: string;
  text: string;
  /** A second paragraph, where the screen needs one. */
  more?: string;
}

const soon = "We'll email you as soon as there's something for you to do. You can close this page.";

export const STAGES: Record<string, StageScreen> = {
  signed_up: { done: 1, screen: 'welcome', heading: '', payoff: '', text: '' },
  confirmed: { done: 1, screen: 'business', heading: '', payoff: '', text: '' },
  not_a_fit: { done: 1, screen: 'not_a_fit', heading: '', payoff: '', text: '' },
  ready: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs come next.', text: "That's everything we need. We'll make five designs for your new website and email and text you when they're ready to look at, usually within a few working days. You can close this page." },
  claimed: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs come next.', text: soon },
  designing: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs are being made.', text: soon },
  designs_received: { done: 2, screen: 'message', heading: "We're on it.", payoff: 'Your designs are being made.', text: soon },
  // If a job says its designs are ready but none arrive with it, the plain message below is shown instead.
  designs_ready: { done: 2, screen: 'designs', heading: 'Your five designs', payoff: 'are nearly here.', text: "We're getting them ready to show you. Please look again in a few minutes." },
  ranked: {
    done: 3,
    screen: 'message',
    heading: 'Thanks.',
    payoff: "We're working out your costing.",
    text: 'We have your design choices and are working out the cost to deliver your website. We\'ll email you when it\'s ready.',
    more: 'Any further rounds of feedback can be booked as a paid video meeting. That lets us go through your design with you and gather the right feedback to get the results you need.',
  },
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
