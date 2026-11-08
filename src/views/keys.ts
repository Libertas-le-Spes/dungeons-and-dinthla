export function isSubmit(event: KeyboardEvent, needsModifier: boolean): boolean {
  if (event.key !== "Enter" || event.isComposing) return false;
  if (!needsModifier) return true;
  return event.ctrlKey || event.metaKey;
}
