/**
 * Checks whether a code point is a surrogate or not.
 * A surrogate is a code point that is in the range U+D800 to U+DFFF, inclusive.
 * @param {number} codePoint
 */
export const isSurrogate = (codePoint: number): boolean =>
  codePoint >= 0xd800 && codePoint <= 0xdfff;
