export const MAX_LENGTH = 280; // Skal matche MAX_QUESTION_LENGTH på serveren

// Skal matche varighederne i styles.css
export const EXIT_TIMING = {
  collapse: 250,
  fly: 250 + 450,
  done: 250 + 450 + 350,
};
export const WARP_MS = 3200; // body.is-warping
export const CHAT_OPEN_MS = 700; // .messages.is-opening
export const CHAT_CLOSE_MS = 400; // .messages.is-closing
export const WELCOME_ENTER_MS = 220; // .is-entering

export const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
