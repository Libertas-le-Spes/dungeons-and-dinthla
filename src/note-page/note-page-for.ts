import type { Component } from "obsidian";
import { NoNotePage } from "./no-note-page";
import { NotePage, type NotePageNeeds } from "./note-page";

export function notePageFor(contentEl: HTMLElement, path: string | null, needs: NotePageNeeds): Component {
  if (path === null) return new NoNotePage(contentEl);
  return new NotePage(contentEl, path, needs);
}
