import { ISourceCodeLocation, IPosition } from "./type";

export class SourceLocation implements ISourceCodeLocation {
  public readonly source: string | null = null;
  public readonly start: IPosition;
  public readonly end: IPosition;

  private constructor(start: IPosition, end: IPosition) {
    this.start = start;
    this.end = end;
  }

  public static create(start: IPosition, end: IPosition): ISourceCodeLocation {
    return new SourceLocation(start, end);
  }
}
