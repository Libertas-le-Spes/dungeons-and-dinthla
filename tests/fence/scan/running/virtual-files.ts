import type { FileSystem } from "typescript/unstable/fs";

function entriesIn(files: Map<string, string>, folder: string): { files: string[]; directories: string[] } {
  const inside = [...files.keys()].filter((path) => path.startsWith(`${folder}/`)).map((path) => path.slice(folder.length + 1));
  const direct = inside.filter((path) => !path.includes("/"));
  const directories = inside.filter((path) => path.includes("/")).map((path) => path.slice(0, path.indexOf("/")));
  return { files: direct, directories: [...new Set(directories)] };
}

export function virtualFileSystem(folder: string, files: Map<string, string>): FileSystem {
  const isVirtual = (path: string) => path === folder || path.startsWith(`${folder}/`);
  return {
    readFile: (path) => files.get(path),
    fileExists: (path) => {
      if (files.has(path)) return true;
      if (isVirtual(path)) return false;
      return undefined;
    },
    directoryExists: (path) => {
      if (isVirtual(path)) return [...files.keys()].some((file) => file.startsWith(`${path}/`));
      return undefined;
    },
    getAccessibleEntries: (path) => {
      if (isVirtual(path)) return entriesIn(files, path);
      return undefined;
    },
  };
}
