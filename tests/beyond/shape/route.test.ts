import { describe, expect, it } from "vitest";
import { Online, Pdf } from "../../../src/beyond/shape/route";

describe("the routes", () => {
  it("name the online route by the word kept on a note", () => {
    expect(new Online().name).toBe("online");
  });

  it("name the PDF route by the word kept on a note", () => {
    expect(new Pdf().name).toBe("pdf");
  });

  it("say under a number that the online route worked it out here", () => {
    expect(new Online().source).toBe("Worked out here, from D&D Beyond (online)");
  });

  it("say under a number that the PDF route printed it", () => {
    expect(new Pdf().source).toBe("Printed on D&D Beyond's PDF");
  });
});
