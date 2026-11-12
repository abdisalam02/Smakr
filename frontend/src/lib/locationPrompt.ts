/** One-time location prompt + a way for "Find me" to reopen the help card. */

const SEEN_KEY = "smakr.locationPromptSeen.v1";

export function hasSeenLocationPrompt(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markLocationPromptSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function openLocationPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("smakr:open-location-prompt"));
}
