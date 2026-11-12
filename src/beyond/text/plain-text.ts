const INNERMOST_TAG = /<[^<>]*>/g;

function withoutInnermostTags(text: string): string {
  return text.replace(INNERMOST_TAG, "");
}

export function plainTextOf(text: string): string {
  let plain = text;
  let shorter = withoutInnermostTags(plain);
  while (shorter !== plain) {
    plain = shorter;
    shorter = withoutInnermostTags(plain);
  }
  return plain;
}
