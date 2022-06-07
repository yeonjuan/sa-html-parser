import { CodePointer } from "../code-pointer";

describe("CodePointer", () => {
  test("getCurrent", () => {
    const codePointer = new CodePointer("a");
    expect(codePointer.getCodePoint()).toBe("a".charCodeAt(0));
  });

  test("next", () => {
    const codePointer = new CodePointer("ab");

    codePointer.next();
    expect(codePointer.getCodePoint()).toBe("b".charCodeAt(0));
  });

  test("eat", () => {
    const codePointer = new CodePointer("ab");

    expect(codePointer.eat()).toBe("a".charCodeAt(0));
    expect(codePointer.getCodePoint()).toBe("b".charCodeAt(0));
  });

  test("getStartColumn (singleline)", () => {
    const codePointer = new CodePointer("ab");

    expect(codePointer.getStartColumn()).toBe(0);
    codePointer.next();
    expect(codePointer.getStartColumn()).toBe(1);
  });

  test("getStartColumn (multiline)", () => {
    const codePointer = new CodePointer("a\nb");

    codePointer.next();
    codePointer.next();
    expect(codePointer.getStartColumn()).toBe(0);
  });

  test("getEndColumn (singleline)", () => {
    const codePointer = new CodePointer("ab");

    expect(codePointer.getEndColumn()).toBe(1);
    codePointer.next();
    expect(codePointer.getEndColumn()).toBe(2);
  });

  test("getEndColumn (multiline)", () => {
    const codePointer = new CodePointer("a\nb");

    codePointer.next();
    codePointer.next();
    expect(codePointer.getEndColumn()).toBe(1);
  });

  test("getLine", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getLine()).toBe(1);
    codePointer.next();
    codePointer.next();
    expect(codePointer.getLine()).toBe(2);
  });

  test("getStartColumn", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getStartColumn()).toBe(0);
    codePointer.next();
    expect(codePointer.getStartColumn()).toBe(1);
    codePointer.next();
    expect(codePointer.getStartColumn()).toBe(0);
  });

  test("getEndColumn", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getEndColumn()).toBe(1);
    codePointer.next();
    expect(codePointer.getEndColumn()).toBe(2);
    codePointer.next();
    expect(codePointer.getEndColumn()).toBe(1);
  });

  test("getRangeStart", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getRangeStart()).toBe(0);
    codePointer.next();
    expect(codePointer.getRangeStart()).toBe(1);
    codePointer.next();
    expect(codePointer.getRangeStart()).toBe(2);
  });

  test("getEndRange", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getRangeEnd()).toBe(1);
    codePointer.next();
    expect(codePointer.getRangeEnd()).toBe(2);
    codePointer.next();
    expect(codePointer.getRangeEnd()).toBe(3);
  });

  test("getStartPosition", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getStartPosition()).toMatchObject({
      line: 1,
      column: 0,
    });
    codePointer.next();
    expect(codePointer.getStartPosition()).toMatchObject({
      line: 1,
      column: 1,
    });
    codePointer.next();
    expect(codePointer.getStartPosition()).toMatchObject({
      line: 2,
      column: 0,
    });
  });

  test("getEndPosition", () => {
    const codePointer = new CodePointer("a\nb");

    expect(codePointer.getEndPosition()).toMatchObject({
      line: 1,
      column: 1,
    });
    codePointer.next();
    expect(codePointer.getEndPosition()).toMatchObject({
      line: 1,
      column: 2,
    });
    codePointer.next();
    expect(codePointer.getEndPosition()).toMatchObject({
      line: 2,
      column: 1,
    });
  });
});
