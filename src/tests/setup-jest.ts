import { TestNode } from "../common/types";
import { AnyNode } from "../nodes";

expect.extend({
  toBeNode<T extends AnyNode>(received: T, testNode: TestNode) {
    let pass = true;
    let message = "";

    if (testNode.type !== undefined && received.type !== testNode.type) {
      message = `Expected type: ${received.type} to be ${testNode.type}`;
    }
    if (testNode.range !== undefined) {
      if (received.range[0] !== testNode.range[0]) {
        message = `Expected range.0: ${received.range[0]} to be ${testNode.range[0]}`;
      } else if (received.range[1] !== testNode.range[1]) {
        message = `Expected range.1: ${received.range[1]} to be ${testNode.range[1]}`;
      }
    }
    if (testNode.loc !== undefined) {
      if (received.loc.start.line !== testNode.loc[0].line) {
        message = `Expected loc.start.line: ${received.loc.start.line} to be ${testNode.loc[0].line}`;
      } else if (received.loc.start.column !== testNode.loc[0].column) {
        message = `Expected loc.start.column: ${received.loc.start.column} to be ${testNode.loc[0].column}`;
      } else if (received.loc.end.line !== testNode.loc[1].line) {
        message = `Expected loc.end.line: ${received.loc.end.line} to be ${testNode.loc[1].line}`;
      } else if (received.loc.end.column !== testNode.loc[1].column) {
        message = `Expected loc.end.column: ${received.loc.end.column} to be ${testNode.loc[1].column}`;
      }
    }
    pass = Boolean(!message.length);
    return {
      message: () => message,
      pass,
    };
  },
});
