import {
  isSurrogate,
  isWhitespace,
  isAsciiAlphabet,
  isAsciiLowerAlphabet,
  isAsciiUpperAlphabet,
  isAsciiUpperHexDigit,
  isAsciiLowerHexDigit,
  isAsciiDigit,
  toAsciiLowerCharacter,
  isAsciiAlphaNumeric,
  isNonCharacter,
  isUndefinedCodePoint,
} from "../code-point";

describe("CodePoints Utils", () => {
  test("isSurrogate", () => {
    expect(isSurrogate("a".charCodeAt(0))).toBe(false);
    expect(isSurrogate(0xd800)).toBe(true);
    expect(isSurrogate(0xdfff)).toBe(true);
  });

  test("isWhiteSpace", () => {
    expect(isWhitespace(" ".charCodeAt(0))).toBe(true);
    expect(isWhitespace("\n".charCodeAt(0))).toBe(true);
    expect(isWhitespace("\f".charCodeAt(0))).toBe(true);
    expect(isWhitespace("a".charCodeAt(0))).toBe(false);
  });

  test("isAsciiAlphabet", () => {
    expect(isAsciiAlphabet("a".charCodeAt(0))).toBe(true);
    expect(isAsciiAlphabet("Z".charCodeAt(0))).toBe(true);
    expect(isAsciiAlphabet("!".charCodeAt(0))).toBe(false);
  });

  test("isAsciiLowerAlphabet", () => {
    expect(isAsciiLowerAlphabet("a".charCodeAt(0))).toBe(true);
    expect(isAsciiLowerAlphabet("A".charCodeAt(0))).toBe(false);
  });

  test("isAsciiUpperAlphabet", () => {
    expect(isAsciiUpperAlphabet("a".charCodeAt(0))).toBe(false);
    expect(isAsciiUpperAlphabet("A".charCodeAt(0))).toBe(true);
  });

  test("isAsciiUpperHexDigit", () => {
    expect(isAsciiUpperHexDigit("A".charCodeAt(0))).toBe(true);
    expect(isAsciiUpperHexDigit("G".charCodeAt(0))).toBe(false);
    expect(isAsciiUpperHexDigit("a".charCodeAt(0))).toBe(false);
  });

  test("isAsciiLowerHexDigit", () => {
    expect(isAsciiLowerHexDigit("A".charCodeAt(0))).toBe(false);
    expect(isAsciiLowerHexDigit("G".charCodeAt(0))).toBe(false);
    expect(isAsciiLowerHexDigit("a".charCodeAt(0))).toBe(true);
  });

  test("isAsciiDigit", () => {
    expect(isAsciiDigit("1".charCodeAt(0))).toBe(true);
    expect(isAsciiDigit("a".charCodeAt(0))).toBe(false);
  });

  test("toAsciiLowerCharacter", () => {
    expect(toAsciiLowerCharacter("A".charCodeAt(0))).toBe("a");
  });

  test("isAsciiAlphaNumeric", () => {
    expect(isAsciiAlphaNumeric("a".charCodeAt(0))).toBe(true);
    expect(isAsciiAlphaNumeric("1".charCodeAt(0))).toBe(true);
    expect(isAsciiAlphaNumeric("!".charCodeAt(0))).toBe(false);
  });

  test("isNonCharacter", () => {
    expect(isNonCharacter(0xfdd0)).toBe(true);
    expect(isNonCharacter(0xfdd1)).toBe(true);
    expect(isNonCharacter(0xfddf)).toBe(true);
    expect(isNonCharacter("a".charCodeAt(0))).toBe(false);
  });

  test("isUndefinedCodePoint", () => {
    expect(isUndefinedCodePoint(0xfdd0)).toBe(true);
    expect(isUndefinedCodePoint("a".charCodeAt(0))).toBe(false);
  });
});
