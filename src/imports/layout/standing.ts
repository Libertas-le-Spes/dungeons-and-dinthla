export const STANDING_PROPERTY = "standing";
export const MAIN_CHARACTER_PROPERTY = "character";

export const DIED_STANDING = "died";
export const RETIRED_STANDING = "retired";
export const BACKUP_STANDING = "backup";

export const DIED_WORDS = "Died";
export const RETIRED_WORDS = "Retired";
export const BACKUP_WORDS = "Backup";

export const LEFT_PLAY_MARKS: ReadonlyMap<string, string> = new Map([
  [DIED_STANDING, DIED_WORDS],
  [RETIRED_STANDING, RETIRED_WORDS],
]);
