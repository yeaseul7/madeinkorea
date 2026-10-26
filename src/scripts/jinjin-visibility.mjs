// Resume only pauses caused by leaving the page, never a player's manual pause.
export function createVisibilityPause({ isPlaying, pause, resume }) {
 let automatic = false;
 return {
  hide() { if (isPlaying()) { automatic = true; pause(); } },
  show() { if (automatic) { automatic = false; resume(); } },
  manual() { automatic = false; },
 };
}
