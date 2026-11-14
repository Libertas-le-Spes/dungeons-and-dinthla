import { firstLineAfterProperties } from "../../campaign/paths/session-file";
import { IMPORTED_FROM_PROPERTY } from "../../imports/layout/import-properties";
import { BACKUP_STANDING, LEFT_PLAY_MARKS, standingIn } from "../../imports/layout/standing";
import { noteLinesOf } from "../imported/reading/note-lines";
import { propertyEntriesOf, type PropertyEntry } from "../imported/reading/property-entries";

export interface CardStanding {
  readonly standing: string | null;
  readonly imported: boolean;
}

function valueOf(entries: readonly PropertyEntry[], key: string): string | null {
  for (const entry of entries) {
    if (entry.key === key) return entry.value.trim();
  }
  return null;
}

export function cardStandingOf(text: string): CardStanding {
  const lines = noteLinesOf(text);
  const bodyStart = firstLineAfterProperties(text);
  const entries = propertyEntriesOf(lines, bodyStart);
  return { standing: standingIn(lines, bodyStart), imported: valueOf(entries, IMPORTED_FROM_PROPERTY) !== null };
}

export function leftPlayMarkOf(standing: CardStanding): string | null {
  if (standing.standing === null) return null;
  const mark = LEFT_PLAY_MARKS.get(standing.standing);
  if (mark === undefined) return null;
  return mark;
}

function isMarkedBackup(standing: CardStanding): boolean {
  return standing.standing === BACKUP_STANDING;
}

function isKeptReady(standing: CardStanding): boolean {
  return standing.imported && standing.standing === null;
}

export function isBackupStanding(standing: CardStanding): boolean {
  return isMarkedBackup(standing) || isKeptReady(standing);
}
