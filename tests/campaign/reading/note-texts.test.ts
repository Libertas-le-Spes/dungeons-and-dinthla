import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import type { Gate } from "../../../src/fence/gate/gatekeeper";
import { HostNoteTexts } from "../../../src/campaign/reading/note-texts";
import { notesOverFakes } from "../../host/notes-over-fakes";

function textsOver(gate: Pick<Gate, "files" | "metadata">): HostNoteTexts {
  return new HostNoteTexts(notesOverFakes({ files: gate.files, metadata: gate.metadata }));
}

const OLD_MILL = "Pale Moon/Places/Old Mill.md";

function appWith(text: string) {
  const file = { path: OLD_MILL } as TFile;
  const cacheListeners = new Map<string, (...args: unknown[]) => void>();
  const vaultListeners = new Map<string, (...args: unknown[]) => void>();
  const metadataCache = {
    on: vi.fn((name: string, listener: (...args: unknown[]) => void) => {
      cacheListeners.set(name, listener);
      return `cache ${name}`;
    }),
    offref: vi.fn(),
  };
  const vault = {
    getFileByPath: vi.fn((path: string) => {
      if (path !== OLD_MILL) return null;
      return file;
    }),
    read: vi.fn(async () => text),
    on: vi.fn((name: string, listener: (...args: unknown[]) => void) => {
      vaultListeners.set(name, listener);
      return `vault ${name}`;
    }),
    offref: vi.fn(),
  };
  const gate = { files: vault, metadata: metadataCache } as unknown as Gate;
  return { gate, vault, metadataCache, file, cacheListeners, vaultListeners };
}

describe("noteTextsOf", () => {
  it("reads a note's text fresh from the vault, and nothing for a note that isn't there", async () => {
    const { gate, vault, file } = appWith("The wheel turns.");
    const texts = textsOver(gate);
    expect(await texts.read(OLD_MILL)).toBe("The wheel turns.");
    expect(vault.read).toHaveBeenCalledExactlyOnceWith(file);
    expect(await texts.read("Pale Moon/Places/Gilded Stag.md")).toBeNull();
    expect(vault.read).toHaveBeenCalledOnce();
  });

  it("reads a note with Windows line endings or a mark at its start as a box shows it", async () => {
    const { gate } = appWith("\uFEFFThe wheel turns.\r\nRain.\r\n");
    expect(await textsOver(gate).read(OLD_MILL)).toBe("The wheel turns.\nRain.\n");
  });

  it("tells a note's new text as a box shows it", () => {
    const { gate, cacheListeners } = appWith("");
    const changed = vi.fn();
    textsOver(gate).onChanged(changed);
    cacheListeners.get("changed")!({ path: OLD_MILL }, "\uFEFFThe wheel is still.\r\nRain.");
    expect(changed).toHaveBeenCalledExactlyOnceWith(OLD_MILL, "The wheel is still.\nRain.");
  });

  it("tells when a note's text changes, with the new text, until told to stop", () => {
    const { gate, metadataCache, cacheListeners } = appWith("");
    const changed = vi.fn();
    const stop = textsOver(gate).onChanged(changed);
    expect(metadataCache.on).toHaveBeenCalledExactlyOnceWith("changed", expect.any(Function));
    cacheListeners.get("changed")!({ path: OLD_MILL }, "The wheel is still.");
    expect(changed).toHaveBeenCalledExactlyOnceWith(OLD_MILL, "The wheel is still.");
    stop();
    expect(metadataCache.offref).toHaveBeenCalledExactlyOnceWith("cache changed");
  });

  it("tells when a note is deleted, until told to stop", () => {
    const { gate, vault, vaultListeners } = appWith("");
    const gone = vi.fn();
    const stop = textsOver(gate).onGone(gone);
    expect(vault.on).toHaveBeenCalledExactlyOnceWith("delete", expect.any(Function));
    vaultListeners.get("delete")!({ path: OLD_MILL });
    expect(gone).toHaveBeenCalledExactlyOnceWith(OLD_MILL);
    stop();
    expect(vault.offref).toHaveBeenCalledExactlyOnceWith("vault delete");
  });
});
