// Verbs that don't end in -ed / -ing
export const STRONG_IRREGULAR = new Set([
  "led", "built", "ran", "drove", "grew", "won", "cut", "wrote", "taught", "sold", "spun", "shaped",
]);

export const WEAK_STARTS = new Set([
  "worked", "working", "helped", "helping", "assisted", "assisting", "responsible", "involved",
  "participated", "participating", "handled", "handling", "tasked", "duties", "did", "made", "used",
  "needed", "required", "supported",
]);

export const WEAK_PHRASES =
  /responsible for|worked on|helped with|duties included|involved in|in charge of|tasked with/i;

export function startsStrong(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  if (!first || WEAK_STARTS.has(first)) return false;
  return STRONG_IRREGULAR.has(first) || /^[a-z]{3,}(ed|ing)$/.test(first);
}