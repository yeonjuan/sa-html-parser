import type { Position } from "../source-code-location";

export interface PositionTrackerActionAPI {
  track(index: number, char: string): void;
}

export interface PositionTrackerGetAPI {
  getStartPosition(): Position;
  getStartRange(): number;
}
