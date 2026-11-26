import { describe, expect, it } from "vitest";
import { fileAt } from "../stubs/note-files";
import { createSession, nextSessionNumber, type SessionFileActions, type SessionFiles } from "../../src/sessions/create-session";

class FakeSessionVault {
  readonly files = new Map<string, string>();
  readonly folders = new Set<string>();
  readonly properties = new Map<string, Record<string, unknown>>();

  constructor(paths: string[], folders: string[]) {
    for (const path of paths) this.files.set(path, "");
    for (const folder of folders) this.folders.add(folder);
  }

  get vault(): SessionFiles {
    return {
      files: () => [...this.files.keys()].map((path) => fileAt(path)),
      hasFolder: (path) => this.folders.has(path),
      makeFolder: async (path) => {
        if (this.folders.has(path)) throw new Error("Folder already exists.");
        this.folders.add(path);
      },
      make: async (path, data) => {
        if (this.files.has(path)) throw new Error("File already exists.");
        this.files.set(path, data);
        return fileAt(path);
      },
    };
  }

  get fileManager(): SessionFileActions {
    return {
      changeProperties: async (file, change) => {
        const properties: Record<string, unknown> = {};
        change(properties);
        this.properties.set(file.path, properties);
      },
    };
  }
}

describe("nextSessionNumber", () => {
  it("numbers the next session one past the highest, whatever the gaps", () => {
    const paths = ["Pale Moon/Sessions/Session 2.md", "Pale Moon/Sessions/Session 10.md", "Pale Moon/Pale Moon.md"];
    expect(nextSessionNumber(paths, "Pale Moon")).toBe(11);
  });

  it("starts a campaign with no sessions at 1", () => {
    expect(nextSessionNumber(["Pale Moon/Pale Moon.md"], "Pale Moon")).toBe(1);
  });

  it("counts only this campaign's sessions", () => {
    expect(nextSessionNumber(["Ashen Road/Sessions/Session 4.md"], "Pale Moon")).toBe(1);
  });
});

describe("createSession", () => {
  it("makes the next session note with the date played and its title", async () => {
    const fake = new FakeSessionVault(["Pale Moon/Sessions/Session 3.md"], ["Pale Moon/Sessions"]);
    const note = await createSession(fake.vault, fake.fileManager, "Pale Moon", {
      title: "  The ferry at dusk ",
      played: "2026-03-21",
    });
    expect(note.path).toBe("Pale Moon/Sessions/Session 4.md");
    expect(fake.properties.get(note.path)).toEqual({ played: "2026-03-21", title: "The ferry at dusk" });
  });

  it("leaves the title out when none is given, and still names the note by its number", async () => {
    const fake = new FakeSessionVault([], ["Pale Moon/Sessions"]);
    const note = await createSession(fake.vault, fake.fileManager, "Pale Moon", { title: "   ", played: "2026-03-14" });
    expect(note.path).toBe("Pale Moon/Sessions/Session 1.md");
    expect(fake.properties.get(note.path)).toEqual({ played: "2026-03-14" });
  });

  it("gives two sessions played on the same day their own notes", async () => {
    const fake = new FakeSessionVault([], ["Pale Moon/Sessions"]);
    const first = await createSession(fake.vault, fake.fileManager, "Pale Moon", { title: "", played: "2026-03-14" });
    const second = await createSession(fake.vault, fake.fileManager, "Pale Moon", { title: "", played: "2026-03-14" });
    expect([first.path, second.path]).toEqual(["Pale Moon/Sessions/Session 1.md", "Pale Moon/Sessions/Session 2.md"]);
  });

  it("makes the Sessions folder when the campaign has none yet", async () => {
    const fake = new FakeSessionVault(["Pale Moon/Pale Moon.md"], []);
    await createSession(fake.vault, fake.fileManager, "Pale Moon", { title: "", played: "2026-03-14" });
    expect(fake.folders.has("Pale Moon/Sessions")).toBe(true);
  });
});
