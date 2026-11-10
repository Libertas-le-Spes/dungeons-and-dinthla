import { readFileSync } from "node:fs";
import { exitCodeOfCheck } from "./release-network-check.ts";

const [, , ...paths] = process.argv;

const exitCode = exitCodeOfCheck(paths, {
  read: (path) => readFileSync(path, "utf8"),
  said: (line) => console.log(line),
  failed: (line) => console.error(line),
});

process.exit(exitCode);
