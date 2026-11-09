import { sessionLabelOf } from "../campaign/session-file";
import { latestSession } from "../campaign/session-to-write";
import { shownPlayedDate } from "../sessions/played-date";
import type { SessionProperties } from "../sessions/session-properties";

export interface SessionOnFile {
  path: string;
  number: number;
}

export interface SessionChoice {
  path: string;
  heading: string;
  label: string;
}

export type PropertiesOf = (path: string) => SessionProperties;

function joined(parts: string[]): string {
  return parts.filter((part) => part !== "").join(" · ");
}

function newestFirst(first: SessionOnFile, second: SessionOnFile): number {
  if (first.number !== second.number) return second.number - first.number;
  return first.path.localeCompare(second.path);
}

export function sessionChoiceOf(path: string, propertiesOf: PropertiesOf): SessionChoice {
  const properties = propertiesOf(path);
  const label = sessionLabelOf(path);
  return {
    path,
    heading: joined([label, properties.title]),
    label: joined([label, properties.title, shownPlayedDate(properties.played)]),
  };
}

export function sessionChoicesOf(sessions: SessionOnFile[], propertiesOf: PropertiesOf): SessionChoice[] {
  return [...sessions].sort(newestFirst).map((session) => sessionChoiceOf(session.path, propertiesOf));
}

export function sessionShown(asked: string | null, campaignFolder: string | null, sessions: SessionOnFile[]): string | null {
  if (asked !== null) return asked;
  if (campaignFolder === null) return null;
  return latestSession(campaignFolder, sessions.map((session) => session.path));
}
