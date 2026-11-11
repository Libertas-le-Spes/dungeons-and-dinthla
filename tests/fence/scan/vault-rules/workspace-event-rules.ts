import { EVENT_LISTENER, EVENT_OWNERS, GATE_FOLDER, NOTE_EVENTS } from "../reading/names";
import type { FileScan } from "../reading/file-scan";

export function workspaceEventBreaches(scan: FileScan): string[] {
  const { project, found, where, types, allowances, path } = scan;
  const breaches: string[] = [];
  for (const { node } of types.ownedReads(project, found, EVENT_LISTENER, EVENT_OWNERS)) {
    const event = found.listenedEvents.get(node);
    if (event === undefined) {
      if (!path.includes(GATE_FOLDER)) breaches.push(`${where(node)} listens to a workspace event it can't read`);
      continue;
    }
    if (NOTE_EVENTS.includes(event) && !allowances.noteEvents(path)) breaches.push(`${where(node)} listens to the ${event} workspace event, which hands over any note`);
  }
  return breaches;
}
