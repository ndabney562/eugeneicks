/**
 * Display settings. The game renders at a fixed logical height and a width
 * that matches the phone's aspect ratio, then scales to fill the screen.
 * 720 px tall is sharp on iPhones without making the GPU work too hard.
 */
export const DISPLAY = {
  logicalHeight: 720,
  /** Narrowest/widest aspect ratios we lay out for (iPad-ish to an iPhone in Safari with its toolbars showing). */
  minAspect: 4 / 3,
  maxAspect: 3.2,
  backgroundColor: '#0d2b2e',
  /** FPS counter and build label: only with ?debug (the build label is also in the pause menu). */
  showFps: false,
  /** START: the title fades to black, then the clinic fades in from black. */
  fadeOutMs: 450,
  fadeInMs: 650,
  /**
   * Title poster: up to this screen aspect (every iPhone in landscape is ~2.17) the poster fills the screen,
   * cropping its top and bottom; wider windows show the whole poster over a blurred, dimmed copy.
   */
  titleCoverMaxAspect: 2.35,
  /** Share of the poster's cropped height taken from the top (the rest from the floor behind the bottom pills). */
  titleCropTop: 0.2,
  /**
   * The title's tab row (PROVIDERS, LOCKER...): px it sits below the header pills, away from the screen's top edge,
   * the share of the free width between those pills it spans, so the outer tabs sit nearer the middle, and how much
   * bigger than the header's other text the tabs are drawn, for easier tapping.
   */
  titleTabs: { drop: 14, widthShare: 0.82, scale: 1.25 },
  /**
   * World signs (room prices, station labels, door signs) fade while a HUD control, banner or toast covers them,
   * or while they run off the screen edge, so no two pieces of text are read on top of each other.
   */
  signFade: {
    /** Share of the sign's normal opacity left while it's covered. */
    alpha: 0.12,
    /** Screen px of breathing room kept around HUD controls. */
    padding: 6,
    /** How long a full fade takes. */
    ms: 180,
  },
};
