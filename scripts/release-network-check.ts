import { networkCodeIn } from "./network-code.ts";
import { styleNetworkCodeIn } from "./style-network-code.ts";

export interface FileChecker {
  ending: string;
  networkCodeIn: (text: string) => string[];
  allowed: string;
}

export interface CheckNeeds {
  read: (path: string) => string;
  said: (line: string) => void;
  failed: (line: string) => void;
}

export const NO_FILES = "Name the files to check, such as: node scripts/check-no-network.ts main.js styles.css";

const CHECKERS: FileChecker[] = [
  { ending: ".js", networkCodeIn, allowed: " (the plugin's one D&D Beyond call is the only network use)" },
  { ending: ".css", networkCodeIn: styleNetworkCodeIn, allowed: "" },
];

function checkerFor(path: string): FileChecker | undefined {
  return CHECKERS.find((checker) => path.endsWith(checker.ending));
}

function foundIn(path: string, needs: CheckNeeds): string[] {
  const checker = checkerFor(path);
  if (checker === undefined) {
    needs.failed(`${path} isn't a .js or .css file, so it can't be checked.`);
    return [path];
  }
  const found = checker.networkCodeIn(needs.read(path));
  for (const name of found) needs.failed(`${path} holds network code: ${name}`);
  if (found.length === 0) needs.said(`${path} holds no network code beyond what is allowed${checker.allowed}.`);
  return found;
}

export function exitCodeOfCheck(paths: string[], needs: CheckNeeds): number {
  if (paths.length === 0) {
    needs.failed(NO_FILES);
    return 1;
  }
  const found = paths.flatMap((path) => foundIn(path, needs));
  if (found.length > 0) return 1;
  return 0;
}
