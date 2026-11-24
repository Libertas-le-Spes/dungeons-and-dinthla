import { fileAt } from "../stubs/note-files";

export function propertiesAt(path: string, properties: Record<string, unknown> | null) {
  const note = fileAt(path);
  return {
    store: {
      note: (asked: string) => {
        if (asked !== path) return null;
        return note;
      },
    },
    facts: { propertiesOf: () => properties },
  };
}
