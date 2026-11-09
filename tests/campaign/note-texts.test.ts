import { describe, expect, it, vi } from "vitest";
import type { App, TFile } from "obsidian";
import { noteTextsOf } from "../../src/campaign/note-texts";

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
  const app = { vault, metadataCache } as unknown as App;
  return { app, vault, metadataCache, file, cacheListeners, vaultListeners };
}

describe("noteTextsOf", () => {
  it("reads a note's text fresh from the vault, and nothing for a note that isn't there", async () => {
    const { app, vault, file } = appWith("The wheel turns.");
    const texts = noteTextsOf(app);
    expect(await texts.read(OLD_MILL)).toBe("The wheel turns.");
    expect(vault.read).toHaveBeenCalledExactlyOnceWith(file);
    expect(await texts.read("Pale Moon/Places/Gilded Stag.md")).toBeNull();
    expect(vault.read).toHaveBeenCalledOnce();
  });

  it("tells when a note's text changes, with the new text, until told to stop", () => {
    const { app, metadataCache, cacheListeners } = appWith("");
    const changed = vi.fn();
    const stop = noteTextsOf(app).onChanged(changed);
    expect(metadataCache.on).toHaveBeenCalledExactlyOnceWith("changed", expect.any(Function));
    cacheListeners.get("changed")!({ path: OLD_MILL }, "The wheel is still.");
    expect(changed).toHaveBeenCalledExactlyOnceWith(OLD_MILL, "The wheel is still.");
    stop();
    expect(metadataCache.offref).toHaveBeenCalledExactlyOnceWith("cache changed");
  });

  it("tells when a note is deleted, until told to stop", () => {
    const { app, vault, vaultListeners } = appWith("");
    const gone = vi.fn();
    const stop = noteTextsOf(app).onGone(gone);
    expect(vault.on).toHaveBeenCalledExactlyOnceWith("delete", expect.any(Function));
    vaultListeners.get("delete")!({ path: OLD_MILL });
    expect(gone).toHaveBeenCalledExactlyOnceWith(OLD_MILL);
    stop();
    expect(vault.offref).toHaveBeenCalledExactlyOnceWith("vault delete");
  });
});
