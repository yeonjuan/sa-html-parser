import { OpenElementStack } from "../open-element-stack";

describe("Test OpenElementStack", () => {
  let stack: OpenElementStack<any>;
  beforeEach(() => {
    stack = new OpenElementStack();
  });

  it("push", () => {
    const element1 = {};
    const element2 = {};

    stack.push(element1);
    expect(stack.top).toBe(element1);

    stack.push(element2);
    expect(stack.top).toBe(element2);
  });

  it("pop", () => {
    const element1 = {};
    const element2 = {};

    stack.push(element1);
    stack.push(element2);

    stack.pop();
    expect(stack.top).toBe(element1);
  });

  it("popUntilFind", () => {
    const element1 = {};
    const element2 = {};
    const element3 = {};

    stack.push(element1);
    stack.push(element2);
    stack.push(element3);

    const popped = stack.popUntilFind(element1);
    expect(popped[0]).toBe(element3);
    expect(popped[1]).toBe(element2);
    expect(popped[2]).toBe(element1);
  });
});
