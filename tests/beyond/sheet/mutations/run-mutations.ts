import { fileURLToPath } from "node:url";
import { runMutations } from "../../../mutation-support/mutation-runner.ts";

await runMutations({
  name: "sheet",
  root: fileURLToPath(new URL("../../../..", import.meta.url)),
  suites: ["tests/beyond/sheet", "tests/beyond/shape/one-row-each.test.ts", "tests/beyond/reply/read-reply.test.ts", "tests/build/inner-folders.test.ts"],
  limits: { memoryMax: "4G", seconds: 120 },
  mutations: new URL("./mutations.json", import.meta.url),
});
