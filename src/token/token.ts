import type { IToken } from "./type";
import {
  SourceLocation,
  ISourceCodeLocation,
  IPosition,
} from "../source-location";

export class Token implements IToken {
  public type: string;
  public loc: ISourceCodeLocation;
  public value: string;
  public range: [number, number];

  private constructor(
    type: string,
    loc: ISourceCodeLocation,
    value: string,
    range: [number, number]
  ) {
    this.type = type;
    this.loc = loc;
    this.value = value;
    this.range = range;
  }

  /**
   * Create `Token`.
   * @param {string} type type of the token.
   * @param {string} value value of the token.
   * @param {number} startRange start range of the token.
   * @param {IPosition} startPos start position of the token.
   * @returns {IToken} returns `Token` instance.
   */
  public static create(
    type: string,
    value: string,
    startRange: number,
    startPos: IPosition
  ): IToken {
    const tokenLength = value.length;
    const loc = SourceLocation.create(startPos, {
      line: startPos.line,
      column: startPos.column + tokenLength,
    });
    const range: [number, number] = [startRange, startRange + tokenLength];
    return new Token(type, loc, value, range);
  }
}
