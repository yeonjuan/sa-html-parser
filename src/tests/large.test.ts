import { Parser } from "../parser";
import * as fs from "fs";
import * as path from "path";

describe("large", () => {
  let parser: Parser;
  const largeHTML = fs.readFileSync(
    path.join(__dirname, "large.html"),
    "utf-8"
  );

  beforeEach(() => {
    parser = new Parser();
  });

  it("large.html", () => {
    const result = parser.parse(largeHTML);
    expect(result).toBeTruthy();
  });
});
