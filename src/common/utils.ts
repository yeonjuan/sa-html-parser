import { AnyNode } from "../nodes";
import { CODE_POINTS } from "./constants";

const UNDEFINED_CODE_POINTS = [
  0xfffe, 0xffff, 0x1fffe, 0x1ffff, 0x2fffe, 0x2ffff, 0x3fffe, 0x3ffff, 0x4fffe,
  0x4ffff, 0x5fffe, 0x5ffff, 0x6fffe, 0x6ffff, 0x7fffe, 0x7ffff, 0x8fffe,
  0x8ffff, 0x9fffe, 0x9ffff, 0xafffe, 0xaffff, 0xbfffe, 0xbffff, 0xcfffe,
  0xcffff, 0xdfffe, 0xdffff, 0xefffe, 0xeffff, 0xffffe, 0xfffff, 0x10fffe,
  0x10ffff,
];

// https://infra.spec.whatwg.org/#noncharacter
const NON_CHARACTER_CODE_POINTS_SET = new Set([
  0xfffe, 0xffff, 0x1fffe, 0x1ffff, 0x2fffe, 0x2ffff, 0x3fffe, 0x3ffff, 0x4fffe,
  0x4ffff, 0x5fffe, 0x5ffff, 0x6fffe, 0x6ffff, 0x7fffe, 0x7ffff, 0x8fffe,
  0x8ffff, 0x9fffe, 0x9ffff, 0xafffe, 0xaffff, 0xbfffe, 0xbffff, 0xcfffe,
  0xcffff, 0xdfffe, 0xdffff, 0xefffe, 0xeffff, 0xffffe, 0xfffff, 0x10fffe,
  0x10ffff,
]);

/**
 * Checks whether a code point is a surrogate or not.
 * @see https://infra.spec.whatwg.org/#surrogate
 * @param {number} codePoint
 * @returns {boolean} Returns `true` if the given `codePoint` is a surrogate, otherwise `false`.
 */
export const isSurrogate = (codePoint: number): boolean =>
  codePoint >= 0xd800 && codePoint <= 0xdfff;

/**
 * Checks whether a code point is a noncharacter or not.
 * @see https://infra.spec.whatwg.org/#noncharacter
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isNonCharacter = (codePoint: number): boolean =>
  (codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
  NON_CHARACTER_CODE_POINTS_SET.has(codePoint);

/**
 * Checks whether a code point is a ASCII alpha or not.
 * @see https://infra.spec.whatwg.org/#ascii-alpha
 * @param {number} codePoint
 * @returns {boolean} Returns `true` if the given `codePoint` is an ASCII alpha, otherwise `false`.
 */
export const isAsciiAlpha = (codePoint: number): boolean =>
  isAsciiLowerAlpha(codePoint) || isAsciiUpperAlpha(codePoint);

/**
 * Checks whether a code point is an ASCII lower alpha or not.
 * @see https://infra.spec.whatwg.org/#ascii-lower-alpha
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isAsciiLowerAlpha = (codePoint: number): boolean =>
  codePoint >= CODE_POINTS.LATIN_SMALL_A &&
  codePoint <= CODE_POINTS.LATIN_SMALL_Z;

/**
 * Checks whether the given `codePoint` is an Ascii upper alpha or not.
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isAsciiUpperAlpha = (codePoint: number): boolean =>
  codePoint >= CODE_POINTS.LATIN_CAPITAL_A &&
  codePoint <= CODE_POINTS.LATIN_CAPITAL_Z;

/**
 * Checks whether the given `codePoint` is an whitespace characters(`\n, \r\n ...`) or not.
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isWhitespace = (codePoint: number): boolean =>
  codePoint === CODE_POINTS.SPACE ||
  codePoint === CODE_POINTS.LINE_FEED ||
  codePoint === CODE_POINTS.TABULATION ||
  codePoint === CODE_POINTS.FORM_FEED;

/**
 * Converts the `codePoint` to string.
 * @param {number} codePoint
 * @returns {string}
 */
export const toCharacter = (codePoint: number): string => {
  if (codePoint <= 0xffff) {
    return String.fromCharCode(codePoint);
  }

  codePoint -= 0x10000;
  return (
    String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800) +
    String.fromCharCode(0xdc00 | (codePoint & 0x3ff))
  );
};

/**
 * Converts the `codePoint` to ascii lower code point.
 * @param {number} codePoint
 * @returns {number}
 */
export const toAsciiLowerCodePoint = (codePoint: number): number =>
  codePoint + 0x0020;

/**
 * Converts the `codePoint` to ascii lower character.
 * @param {number} codePoint
 * @returns {string}
 */
export const toAsciiLowerCharacter = (codePoint: number): string =>
  String.fromCharCode(toAsciiLowerCodePoint(codePoint));

/**
 * Checks whether the given `codePoint` is an ascii digit or not.
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isAsciiDigit = (codePoint: number): boolean =>
  codePoint >= CODE_POINTS.DIGIT_0 && codePoint <= CODE_POINTS.DIGIT_9;

/**
 * Checks whether the given `codePoint` is an ascii alpha numeric or not.
 * @param {number} codePoint
 * @returns {boolean}
 */
export const isAsciiAlphaNumeric = (codePoint: number): boolean =>
  isAsciiAlpha(codePoint) || isAsciiDigit(codePoint);

export const isUndefinedCodePoint = (codePoint: number): boolean =>
  (codePoint >= 0xfdd0 && codePoint <= 0xfdef) ||
  UNDEFINED_CODE_POINTS.indexOf(codePoint) > -1;

export const isControlCodePoint = (codePoint: number): boolean =>
  (codePoint !== 0x20 &&
    codePoint !== 0x0a &&
    codePoint !== 0x0d &&
    codePoint !== 0x09 &&
    codePoint !== 0x0c &&
    codePoint >= 0x01 &&
    codePoint <= 0x1f) ||
  (codePoint >= 0x7f && codePoint <= 0x9f);

export const isAsciiUpperHexDigit = (codePoint: number): boolean =>
  codePoint >= CODE_POINTS.LATIN_CAPITAL_A &&
  codePoint <= CODE_POINTS.LATIN_CAPITAL_F;

export const isAsciiLowerHexDigit = (codePoint: number): boolean =>
  codePoint >= CODE_POINTS.LATIN_SMALL_A &&
  codePoint <= CODE_POINTS.LATIN_SMALL_F;

export const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

export const getChildrenRecursively = (node: AnyNode) => {
  const children: any[] = [];
  if (node.type === "Element") {
    if (node.closingElement) {
      return children;
    }
    node.children.forEach((child: any) => {
      children.push(child);
      children.push(...getChildrenRecursively(child));
    });
  }
  return children;
};
