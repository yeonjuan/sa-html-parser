import { CODE_POINTS } from "../common/constants";
import { Position } from "../common/types";

export class CodePointer {
  private pointer = 0;
  private lineStartPointer = 0;
  private line = 1;
  private wasEndOfLine = false;

  constructor(private codes: string) {}

  /**
   * Returns the unicode of the character which the code pointer indicates.
   * @returns {number} unicode
   */
  public getCodePoint(): number {
    return this.codes[this.pointer].charCodeAt(0);
  }

  /**
   * Returns the unicode of the character which the code pointer indicates,
   * and moves the pointer to the next.
   * @returns {number} Unicode
   */
  public eat(): number {
    const code = this.getCodePoint();
    this.next();
    return code;
  }

  /**
   * Moves the code pointer to the next.
   * @returns {void}
   */
  public next(): void {
    this.pointer++;
    const code = this.getCodePoint();
    if (this.wasEndOfLine) {
      this.wasEndOfLine = false;
      this.line++;
      this.lineStartPointer = this.pointer;
    }

    if (code === CODE_POINTS.LINE_FEED) {
      this.wasEndOfLine = true;
    }
  }

  /**
   * Returns start column of the current code pointer indicates.
   * @returns {number} start column
   */
  public getStartColumn(): number {
    return this.pointer - this.lineStartPointer;
  }

  /**
   * Returns end column of the current code pointer indicates.
   * @returns {number} end column
   */
  public getEndColumn(): number {
    return this.getStartColumn() + 1;
  }

  /**
   * Returns the start range index.
   * @returns {number} start range index
   */
  public getRangeStart(): number {
    return this.pointer;
  }

  /**
   * Returns the end range index.
   * @returns {number} end range index
   */
  public getRangeEnd(): number {
    return this.pointer + 1;
  }

  /**
   * Returns the line.
   * @returns {number} line
   */
  public getLine(): number {
    return this.line;
  }

  /**
   * Returns the start position of the current pointer indicates.
   * @returns {Position} start position
   */
  public getStartPosition(): Position {
    return {
      line: this.getLine(),
      column: this.getStartColumn(),
    };
  }

  /**
   * Returns the end position of the current pointer indicates.
   * @returns {Position} end position
   */
  public getEndPosition(): Position {
    return {
      line: this.getLine(),
      column: this.getEndColumn(),
    };
  }
}
