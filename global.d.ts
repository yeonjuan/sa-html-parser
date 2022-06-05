import { TestNode } from "./src/common/types";

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeNode(node: TestNode): R;
    }
  }
}

export {};
