export const STANDING_PROPERTY = "standing";
export const MAIN_CHARACTER_PROPERTY = "character";

export const DIED_STANDING = "died";
export const RETIRED_STANDING = "retired";
export const BACKUP_STANDING = "backup";
export const DEPARTED_STANDING = "departed";

export const DIED_WORDS = "Died";
export const RETIRED_WORDS = "Retired";
export const BACKUP_WORDS = "Backup";
export const MAKE_MAIN_WORDS = "Make main";
export const DEPART_WORDS = "Depart";
export const SOMETHING_ELSE_WORDS = "Something else";
export const DEPARTED_WORDS = "Departed";

export const LEFT_PLAY_MARKS: ReadonlyMap<string, string> = new Map([
  [DIED_STANDING, DIED_WORDS],
  [RETIRED_STANDING, RETIRED_WORDS],
]);

const LEFT_PLAY_STANDINGS: ReadonlySet<string> = new Set([DIED_STANDING, RETIRED_STANDING, DEPARTED_STANDING]);

const STANDING_START = `${STANDING_PROPERTY}:`;

export function standingIn(lines: readonly string[], bodyStart: number): string | null {
  for (const [position, line] of lines.entries()) {
    if (position >= bodyStart - 1 || !line.startsWith(STANDING_START)) continue;
    const value = line.substring(STANDING_START.length).trim();
    if (value !== "") return value;
  }
  return null;
}

export function hasLeftPlay(standing: string | null): boolean {
  if (standing === null) return false;
  return LEFT_PLAY_STANDINGS.has(standing);
}
