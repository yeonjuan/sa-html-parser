import { Parser } from "../parser";
import * as fs from "fs";
import * as path from "path";

describe("large", () => {
  let parser: Parser;
  const simpleHTML = fs.readFileSync(
    path.join(__dirname, "simple-html"),
    "utf-8"
  );

  beforeEach(() => {
    parser = new Parser();
  });

  it("simple.html", () => {
    const result = parser.parse(simpleHTML);
    expect(result).toMatchSnapshot();
  });
});
