export class OpenElementStack<T> {
  public readonly elements: T[] = [];
  public stackTop = -1;
  public top: any = null;

  public push(element: any) {
    this.top = element;
    this.stackTop++;
    this.elements[this.stackTop] = element;
  }

  public pop() {
    this.stackTop--;
    this.top = this.elements[this.stackTop];
  }

  public popUntilFind(element: T): T[] {
    let elements: any[] = [];
    while (this.stackTop > -1) {
      const poppedElement = this.top;
      elements.push(poppedElement);
      this.pop();
      if (poppedElement === element) {
        break;
      }
    }
    return elements;
  }
}
