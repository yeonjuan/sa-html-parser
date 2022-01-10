export class OpenElementStack {
  public readonly elements: any[] = [];
  public stackTop = -1;
  public current: any = null;

  public push(element: any) {
    this.elements.push(element);
    this.current = element;
  }

  public pop() {
    this.stackTop--;
    this.current = this.elements[this.stackTop];
  }

  public popUntilElementPopped(element: any) {
    while (this.stackTop > -1) {
      const poppedElement = this.current;

      this.pop();

      if (poppedElement === element) {
        break;
      }
    }
  }
}
