import { describe, expect, it } from "vitest";
import type { TFile, TFolder } from "obsidian";
import { CHANGED_IN_NOTE, PartlyWritten } from "../../../src/campaign/writing/note-editor";
import { readsBackDifferently, type CharacterEntry } from "../../../src/characters/editing/character-entry";
import { BAD_NAME, LONG_NAME, RESERVED_NAME } from "../../../src/names/file-name";
import {
  NOTE_MOVED,
  createCharacter,
  deleteCharacter,
  saveCharacter,
  type CharacterFileActions,
  type CharacterFiles,
} from "../../../src/characters/editing/character-files";

const FOLDER = "Pale Moon/Characters";

function fileAt(path: string): TFile {
  const name = path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "");
  return { path, basename: name } as TFile;
}

interface VaultSetup {
  notes?: Record<string, string>;
  folders?: string[];
  renameFails?: boolean;
}

function vaultWith({ notes = {}, folders = [FOLDER], renameFails = false }: VaultSetup = {}) {
  const texts = new Map(Object.entries(notes));
  const folderPaths = new Set(folders);
  const created: { path: string; text: string }[] = [];
  const renamed: { from: string; to: string }[] = [];
  const trashed: string[] = [];
  const processed: string[] = [];
  const vault: CharacterFiles = {
    getFiles: () => [...texts.keys()].map(fileAt),
    getFolderByPath: (path) => {
      if (!folderPaths.has(path)) return null;
      return { path } as TFolder;
    },
    createFolder: async (path) => {
      if (folderPaths.has(path)) throw new Error("Folder already exists.");
      folderPaths.add(path);
      return { path } as TFolder;
    },
    create: async (path, text) => {
      if (texts.has(path)) throw new Error("File already exists.");
      texts.set(path, text);
      created.push({ path, text });
      return fileAt(path);
    },
    process: async (file, change) => {
      processed.push(file.path);
      const text = change(texts.get(file.path)!);
      texts.set(file.path, text);
      return text;
    },
  };
  const fileManager: CharacterFileActions = {
    renameFile: async (file, to) => {
      if (renameFails) throw new Error("the disk is full");
      renamed.push({ from: file.path, to });
    },
    trashFile: async (file) => {
      trashed.push(file.path);
    },
  };
  return { vault, fileManager, texts, folderPaths, created, renamed, trashed, processed };
}

function entry(values: Partial<CharacterEntry> = {}): CharacterEntry {
  return { name: "Mira", type: "", subtitle: "", speed: "", ...values };
}

describe("createCharacter", () => {
  it("makes a note named after the character in the campaign's Characters folder, with the values given", async () => {
    const { vault, created } = vaultWith();
    const note = await createCharacter(vault, "Pale Moon", entry({ name: "Brother Aldric", subtitle: "Human Cleric 5" }));
    expect(note).toMatchObject({ path: `${FOLDER}/Brother Aldric.md` });
    expect(created).toEqual([{ path: `${FOLDER}/Brother Aldric.md`, text: "subtitle: Human Cleric 5\n" }]);
  });

  it("makes the Characters folder when the campaign has none yet", async () => {
    const { vault, folderPaths, created } = vaultWith({ folders: [] });
    await createCharacter(vault, "Pale Moon", entry());
    expect(folderPaths.has(FOLDER)).toBe(true);
    expect(created).toEqual([{ path: `${FOLDER}/Mira.md`, text: "" }]);
  });

  it("makes a character whose name holds an emoji joined by invisible joiners", async () => {
    const { vault, created } = vaultWith();
    await createCharacter(vault, "Pale Moon", entry({ name: "Mira \u{1f9d9}\u200d\u2640\ufe0f" }));
    expect(created).toEqual([{ path: `${FOLDER}/Mira \u{1f9d9}\u200d\u2640\ufe0f.md`, text: "" }]);
  });

  it("refuses a character name holding a zero-width space", async () => {
    const { vault, created } = vaultWith();
    await expect(createCharacter(vault, "Pale Moon", entry({ name: "Mi\u200bra" }))).rejects.toThrow(BAD_NAME);
    expect(created).toEqual([]);
  });

  it("writes nothing without a name", async () => {
    const { vault, created, folderPaths } = vaultWith({ folders: [] });
    expect(await createCharacter(vault, "Pale Moon", entry({ name: "" }))).toBeNull();
    expect(created).toEqual([]);
    expect(folderPaths.size).toBe(0);
  });

  it.each(["Mira/Vess", "Mira: the bold", "Mira #2", "[[Mira]]", "Mira^", "Mira|her", "What?", ".Mira", "Mira.", "Mira ", " Mira", "Mi\tra", "Mi\u007fra"])("refuses the name %s", async (name) => {
    const { vault, created } = vaultWith();
    await expect(createCharacter(vault, "Pale Moon", entry({ name }))).rejects.toThrow(BAD_NAME);
    expect(created).toEqual([]);
  });

  it.each(["CON", "prn", "Aux", "nul.txt", "COM1", "lpt9", "com3.old", "COM0", "lpt0", "COM¹", "com²", "LPT³", "lpt¹.txt", "CONIN$", "conout$", "CONIN$.log"])("refuses the name %s, which Windows keeps for itself", async (name) => {
    const { vault, created } = vaultWith();
    await expect(createCharacter(vault, "Pale Moon", entry({ name }))).rejects.toThrow(RESERVED_NAME);
    expect(created).toEqual([]);
  });

  it.each(["Console", "Com", "COM10", "Nully", "CONIN", "COM⁴", "LPT¹0"])("takes the name %s", async (name) => {
    const { vault, created } = vaultWith();
    await createCharacter(vault, "Pale Moon", entry({ name }));
    expect(created).toHaveLength(1);
  });

  it("refuses a name whose file would be over 255 bytes, counting each letter's bytes", async () => {
    const { vault, created } = vaultWith();
    await expect(createCharacter(vault, "Pale Moon", entry({ name: "é".repeat(127) }))).rejects.toThrow(LONG_NAME);
    await createCharacter(vault, "Pale Moon", entry({ name: "é".repeat(126) }));
    expect(created).toHaveLength(1);
  });

  it("refuses a name that only differs from a note's by how its letters are encoded", async () => {
    const { vault, created } = vaultWith({ notes: { [`${FOLDER}/Zo\u00eb.md`]: "" } });
    await expect(createCharacter(vault, "Pale Moon", entry({ name: "Zoe\u0308" }))).rejects.toThrow(`There is already a note called Zo\u00eb in ${FOLDER}.`);
    expect(created).toEqual([]);
  });

  it("writes the note's path the way Obsidian keeps paths", async () => {
    const { vault, created } = vaultWith();
    await createCharacter(vault, "Pale Moon", entry({ name: "Zoe\u0308" }));
    expect(created.map(({ path }) => path)).toEqual([`${FOLDER}/Zo\u00eb.md`]);
  });

  it("refuses a name that only differs from an existing note's by invisible characters", async () => {
    for (const name of ["Ali\u200dce", "Ali\u034fce"]) {
      const { vault, created } = vaultWith({ notes: { [`${FOLDER}/Alice.md`]: "" } });
      await expect(createCharacter(vault, "Pale Moon", entry({ name }))).rejects.toThrow();
      expect(created).toEqual([]);
    }
  });

  it("refuses a plain name when a note made before invisible characters were refused differs from it only by them", async () => {
    for (const existing of ["Ali\u200dce", "Ali\u034fce"]) {
      const { vault, created } = vaultWith({ notes: { [`${FOLDER}/${existing}.md`]: "" } });
      await expect(createCharacter(vault, "Pale Moon", entry({ name: "Alice" }))).rejects.toThrow(`There is already a note called ${existing} in ${FOLDER}.`);
      expect(created).toEqual([]);
    }
  });

  it("refuses a name whose letter is composed differently from an existing note's that hides an invisible character inside it", async () => {
    const existing = "Cafe\u200d\u0301";
    const { vault, created } = vaultWith({ notes: { [`${FOLDER}/${existing}.md`]: "" } });
    await expect(createCharacter(vault, "Pale Moon", entry({ name: "Caf\u00e9" }))).rejects.toThrow(`There is already a note called ${existing} in ${FOLDER}.`);
    expect(created).toEqual([]);
  });

  it("refuses a name that differs from an existing note's only by the kind of space", async () => {
    for (const existing of ["Mira\u00a0Road", "Mira\u3000Road"]) {
      const { vault, created } = vaultWith({ notes: { [`${FOLDER}/${existing}.md`]: "" } });
      await expect(createCharacter(vault, "Pale Moon", entry({ name: "Mira Road" }))).rejects.toThrow(`There is already a note called ${existing} in ${FOLDER}.`);
      expect(created).toEqual([]);
    }
  });

  it("refuses a name a note in the folder already has, whatever its capitals", async () => {
    const { vault, created } = vaultWith({ notes: { [`${FOLDER}/Mira.md`]: "" } });
    await expect(createCharacter(vault, "Pale Moon", entry({ name: "MIRA" }))).rejects.toThrow(`There is already a note called Mira in ${FOLDER}.`);
    expect(created).toEqual([]);
  });

  it("refuses a value that would read back differently", async () => {
    const { vault, created, folderPaths } = vaultWith({ folders: [] });
    await expect(createCharacter(vault, "Pale Moon", entry({ speed: "30 ft., AC: 15" }))).rejects.toThrow(readsBackDifferently("Speed"));
    expect(created).toEqual([]);
    expect(folderPaths.size).toBe(0);
  });
});

describe("saveCharacter", () => {
  const MIRA = `${FOLDER}/Mira.md`;

  it("renames the note through the file manager, so every link follows", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "" } });
    expect(await saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "Mirabel" }))).toBe(true);
    expect(renamed).toEqual([{ from: MIRA, to: `${FOLDER}/Mirabel.md` }]);
    expect(processed).toEqual([]);
  });

  it("keeps a renamed note in its own folder", async () => {
    const path = `${FOLDER}/Villains/Mira.md`;
    const { vault, fileManager, renamed } = vaultWith({ notes: { [path]: "" } });
    await saveCharacter(vault, fileManager, fileAt(path), path, entry(), entry({ name: "Mirabel" }));
    expect(renamed).toEqual([{ from: path, to: `${FOLDER}/Villains/Mirabel.md` }]);
  });

  it("lets a name change only its capitals", async () => {
    const { vault, fileManager, renamed } = vaultWith({ notes: { [MIRA]: "" } });
    await saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "MIRA" }));
    expect(renamed).toEqual([{ from: MIRA, to: `${FOLDER}/MIRA.md` }]);
  });

  it("refuses a rename when the note was moved or renamed since the dialog opened", async () => {
    const moved = `${FOLDER}/Mirabel.md`;
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [moved]: "" } });
    await expect(saveCharacter(vault, fileManager, fileAt(moved), MIRA, entry(), entry({ name: "Mira the Bold", speed: "30 ft." }))).rejects.toThrow(
      NOTE_MOVED,
    );
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("still writes values to a note moved since the dialog opened", async () => {
    const moved = `${FOLDER}/Mirabel.md`;
    const { vault, fileManager, texts } = vaultWith({ notes: { [moved]: "" } });
    await saveCharacter(vault, fileManager, fileAt(moved), MIRA, entry(), entry({ speed: "30 ft." }));
    expect(texts.get(moved)).toBe("speed: 30 ft.\n");
  });

  it("refuses a new name another note in the folder has", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "", [`${FOLDER}/Vess.md`]: "" } });
    await expect(saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "vess", speed: "30 ft." }))).rejects.toThrow(
      `There is already a note called Vess in ${FOLDER}.`,
    );
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("refuses a new name that can't be a note's name", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "" } });
    await expect(saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "Mira/Vess", speed: "30 ft." }))).rejects.toThrow(BAD_NAME);
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("keeps an old name that a new note couldn't have", async () => {
    const path = `${FOLDER}/Mira #2.md`;
    const { vault, fileManager, texts, renamed } = vaultWith({ notes: { [path]: "" } });
    await saveCharacter(vault, fileManager, fileAt(path), path, entry({ name: "Mira #2" }), entry({ name: "Mira #2", speed: "30 ft." }));
    expect(texts.get(path)).toBe("speed: 30 ft.\n");
    expect(renamed).toEqual([]);
  });

  it("writes changed values on the character's own note", async () => {
    const { vault, fileManager, texts, renamed } = vaultWith({ notes: { [MIRA]: "speed: 30 ft.\n" } });
    const before = entry({ speed: "30 ft." });
    await saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, before, entry({ speed: "40 ft.", type: "elf" }));
    expect(texts.get(MIRA)).toBe("speed: 40 ft.\ntype: elf\n");
    expect(renamed).toEqual([]);
  });

  it("writes nothing when nothing changed", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "speed: 30 ft.\n" } });
    const before = entry({ speed: "30 ft." });
    expect(await saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, before, entry({ speed: "30 ft." }))).toBe(true);
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("writes nothing without a name", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "" } });
    expect(await saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "", speed: "30 ft." }))).toBe(false);
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("refuses a value that would read back differently before writing anything", async () => {
    const { vault, fileManager, renamed, processed } = vaultWith({ notes: { [MIRA]: "" } });
    await expect(saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "Mirabel", type: "elf, HP: 3" }))).rejects.toThrow(
      readsBackDifferently("Type line"),
    );
    expect([...renamed, ...processed]).toEqual([]);
  });

  it("leaves the note and its name alone when the note changed since the dialog read it", async () => {
    const { vault, fileManager, texts, renamed } = vaultWith({ notes: { [MIRA]: "speed: 25 ft.\n" } });
    const before = entry({ speed: "30 ft." });
    await expect(saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, before, entry({ name: "Mirabel", speed: "40 ft." }))).rejects.toThrow(CHANGED_IN_NOTE);
    expect(texts.get(MIRA)).toBe("speed: 25 ft.\n");
    expect(renamed).toEqual([]);
  });

  it("says the values were saved when only the rename failed", async () => {
    const { vault, fileManager, texts } = vaultWith({ notes: { [MIRA]: "" }, renameFails: true });
    const saving = saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "Mirabel", speed: "30 ft." }));
    await expect(saving).rejects.toThrow(new PartlyWritten("The values were saved, but the note couldn't be renamed: the disk is full"));
    await expect(saving).rejects.toBeInstanceOf(PartlyWritten);
    expect(texts.get(MIRA)).toBe("speed: 30 ft.\n");
  });

  it("passes on a failed rename as it is when nothing was written", async () => {
    const { vault, fileManager } = vaultWith({ notes: { [MIRA]: "" }, renameFails: true });
    const saving = saveCharacter(vault, fileManager, fileAt(MIRA), MIRA, entry(), entry({ name: "Mirabel" }));
    await expect(saving).rejects.toThrow("the disk is full");
    await expect(saving).rejects.not.toBeInstanceOf(PartlyWritten);
  });
});

describe("deleteCharacter", () => {
  it("moves the note to the trash through the file manager and leaves every other note alone", async () => {
    const session = "Pale Moon/Sessions/Session 1.md";
    const { fileManager, texts, trashed, processed } = vaultWith({ notes: { [`${FOLDER}/Mira.md`]: "", [session]: "[[Mira]] AC: 15\n" } });
    await deleteCharacter(fileManager, fileAt(`${FOLDER}/Mira.md`));
    expect(trashed).toEqual([`${FOLDER}/Mira.md`]);
    expect(processed).toEqual([]);
    expect(texts.get(session)).toBe("[[Mira]] AC: 15\n");
  });
});
