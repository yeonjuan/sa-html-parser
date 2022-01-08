import { PositionTracker } from "../position-tracker";

describe("PositionTracker", () => {
  let positionTracker: PositionTracker;

  beforeEach(() => {
    positionTracker = new PositionTracker();
  });

  it("tracking simple a line", () => {
    const line = "abc";

    positionTracker.track(0, line[0]);

    expect(positionTracker.getStartRange()).toBe(0);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(1, line[1]);
    expect(positionTracker.getStartRange()).toBe(1);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(2, line[2]);
    expect(positionTracker.getStartRange()).toBe(2);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(1);
  });

  it("tracking a line ends with \n", () => {
    const line = "abc\n";

    positionTracker.track(0, line[0]);

    expect(positionTracker.getStartRange()).toBe(0);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(1, line[1]);
    expect(positionTracker.getStartRange()).toBe(1);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(2, line[2]);
    expect(positionTracker.getStartRange()).toBe(2);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(1);
  });

  it("tracking two lines", () => {
    const lines = "abc\ndef";

    positionTracker.track(0, lines[0]);
    expect(positionTracker.getStartRange()).toBe(0);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(1, lines[1]);
    expect(positionTracker.getStartRange()).toBe(1);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(2, lines[2]);
    expect(positionTracker.getStartRange()).toBe(2);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(3, lines[3]);
    expect(positionTracker.getStartRange()).toBe(3);
    expect(positionTracker.getStartPosition().column).toBe(3);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(4, lines[4]);
    expect(positionTracker.getStartRange()).toBe(4);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(2);

    positionTracker.track(5, lines[5]);
    expect(positionTracker.getStartRange()).toBe(5);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(2);

    positionTracker.track(6, lines[6]);
    expect(positionTracker.getStartRange()).toBe(6);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(2);
  });

  it("tracking two lines", () => {
    const lines = "abc\ndef";

    positionTracker.track(0, lines[0]);
    expect(positionTracker.getStartRange()).toBe(0);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(1, lines[1]);
    expect(positionTracker.getStartRange()).toBe(1);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(2, lines[2]);
    expect(positionTracker.getStartRange()).toBe(2);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(3, lines[3]);
    expect(positionTracker.getStartRange()).toBe(3);
    expect(positionTracker.getStartPosition().column).toBe(3);
    expect(positionTracker.getStartPosition().line).toBe(1);

    positionTracker.track(4, lines[4]);
    expect(positionTracker.getStartRange()).toBe(4);
    expect(positionTracker.getStartPosition().column).toBe(0);
    expect(positionTracker.getStartPosition().line).toBe(2);

    positionTracker.track(5, lines[5]);
    expect(positionTracker.getStartRange()).toBe(5);
    expect(positionTracker.getStartPosition().column).toBe(1);
    expect(positionTracker.getStartPosition().line).toBe(2);

    positionTracker.track(6, lines[6]);
    expect(positionTracker.getStartRange()).toBe(6);
    expect(positionTracker.getStartPosition().column).toBe(2);
    expect(positionTracker.getStartPosition().line).toBe(2);
  });
});
