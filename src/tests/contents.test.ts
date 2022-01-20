import { parse } from "../parser";
import * as fs from "fs";
import * as path from "path";

describe("contents", () => {
  const contentsHTML = fs.readFileSync(
    path.join(__dirname, "contents-html"),
    "utf-8"
  );

  it("contents.html", () => {
    const result = parse(contentsHTML);
    expect(result).toMatchSnapshot();
  });
});
