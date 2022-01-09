import type { Range, Position, SourceCodeLocation } from "../common/types";

export class PositionTracker {
  private line: number = 1;
  private column: number = 0;
  private wasEndOfLine: boolean = false;
  private rangeIndex: number = 0;
  private lineStartRangeIndex = 0;

  public track(index: number, character: string): void {
    this.rangeIndex = index;
    if (this.wasEndOfLine) {
      this.wasEndOfLine = false;
      this.line++;
      this.lineStartRangeIndex = this.rangeIndex;
    }

    if (character === "\n") {
      this.wasEndOfLine = true;
    }

    this.column = this.rangeIndex - this.lineStartRangeIndex;
  }

  public back(): void {
    this.wasEndOfLine = false;
  }

  /**
   * Returns current code point's start position
   * @returns {Position} start position.
   */
  public getStartPosition(): Position {
    return {
      line: this.line,
      column: this.column,
    };
  }

  /**
   * Returns current code point's end position
   * @returns {Position} end position.
   */
  public getEndPosition(): Position {
    return {
      line: this.line,
      column: this.column + 1,
    };
  }

  /**
   * Returns current code point's range
   * @returns {Range} range.
   */
  public getLocation(): SourceCodeLocation {
    return {
      start: this.getStartPosition(),
      end: this.getEndPosition(),
    };
  }

  /**
   * Returns current code point's range
   * @returns {Range} range.
   */
  public getRange(): Range {
    return [this.rangeIndex, this.rangeIndex + 1];
  }

  /**
   * Returns current code point's end range index.
   * @returns {number} end of range.
   */
  public getEndRange(): number {
    return this.rangeIndex + 1;
  }

  /**
   * Returns current code point's start range index.
   * @returns {number} start of range.
   */
  public getStartRange(): number {
    return this.rangeIndex;
  }
}
