import { parse } from "../parser";

describe("parser: error", () => {
  test("missing start tag", () => {
    expect(() => parse("<div></span></div>")).toThrow(new Error());
  });
});
