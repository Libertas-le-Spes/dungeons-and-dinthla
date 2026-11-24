import { sessionLabelOf } from "../campaign/paths/session-file";
import { sessionPropertiesOf, type SessionPropertyNotes } from "./session-properties";

export function sessionHeadingOf(path: string, notes: SessionPropertyNotes): string {
  const label = sessionLabelOf(path);
  const title = sessionPropertiesOf(path, notes).title;
  if (title === "") return label;
  return `${label} · ${title}`;
}
