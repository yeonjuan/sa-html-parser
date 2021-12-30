import type { ISourceCodeLocation } from "../source-location";

export interface IToken {
  type: string;
  loc: ISourceCodeLocation;
  range: [number, number];
  value: string;
}
