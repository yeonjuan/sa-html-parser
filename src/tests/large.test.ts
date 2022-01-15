import { parse } from "../parser";
import * as fs from "fs";
import * as path from "path";

describe("large", () => {
  const largeHTML = fs.readFileSync(
    path.join(__dirname, "large-html"),
    "utf-8"
  );

  it("large.html", () => {
    const result = parse(largeHTML);
    expect(result).toBeTruthy();
  });
});
