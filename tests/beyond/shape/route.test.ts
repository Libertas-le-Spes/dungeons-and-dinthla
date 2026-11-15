import { describe, expect, it } from "vitest";
import { Online, Pdf } from "../../../src/beyond/shape/route";

describe("the routes", () => {
  it("name the online route by the word kept on a note", () => {
    expect(new Online().name).toBe("online");
  });

  it("name the PDF route by the word kept on a note", () => {
    expect(new Pdf().name).toBe("pdf");
  });
});
