import { Parser } from "../parser";

describe("parser: error", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  test("missing start tag", () => {
    expect(() => parser.parse("<div></span></div>")).toThrow(new Error());
  });
});
