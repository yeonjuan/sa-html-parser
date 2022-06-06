import type { Range, Position, SourceCodeLocation } from "../common/types";

export class PositionTracker {
  private line: number = 1;
  // private column: number = 0;
  private wasEndOfLine: boolean = false;
  public rangeIndex: number = -1;
  private lineStartRangeIndex = 0;

  private getColumn(): number {
    return this.rangeIndex - this.lineStartRangeIndex;
  }

  public track(index: number, character: string): void {
    this.rangeIndex++;
    if (this.wasEndOfLine) {
      this.wasEndOfLine = false;
      this.line++;
      this.lineStartRangeIndex = this.rangeIndex;
    }

    if (character === "\n") {
      this.wasEndOfLine = true;
    }
  }

  public back(): void {
    this.rangeIndex--;
    this.wasEndOfLine = false;
  }

  /**
   * Returns current code point's start position
   * @returns {Position} start position.
   */
  public getStartPosition(): Position {
    return {
      line: this.line,
      column: this.getColumn(),
    };
  }

  /**
   * Returns current code point's end position
   * @returns {Position} end position.
   */
  public getEndPosition(): Position {
    return {
      line: this.line,
      column: this.getColumn() + 1,
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
