import * as utils from "../utils";
describe("utils", () => {
  test("isSurrogate", () => {
    expect(utils.isSurrogate("a".charCodeAt(0))).toBe(false);
    expect(utils.isSurrogate(0xd800)).toBe(true);
    expect(utils.isSurrogate(0xdfff)).toBe(true);
  });
});
