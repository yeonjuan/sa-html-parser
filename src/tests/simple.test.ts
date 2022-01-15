import { parse } from "../parser";
import * as fs from "fs";
import * as path from "path";

describe("large", () => {
  const simpleHTML = fs.readFileSync(
    path.join(__dirname, "simple-html"),
    "utf-8"
  );

  it("simple.html", () => {
    const result = parse(simpleHTML);
    expect(result).toMatchSnapshot();
  });
});
