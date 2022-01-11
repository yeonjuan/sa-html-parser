import {
  CommentNode,
  DoctypeNode,
  TagNode,
  Root,
  AnyNode,
  EndTagNode,
} from "../nodes";
import { Tokenizer } from "../tokenizer/tokenizer";
import { AnyHtmlToken, HtmlTokenType } from "../tokens";
import { OpenElementStack } from "./open-element-stack";
import * as utils from "../common/utils";

export class Parser {
  private root!: Root;
  private html!: string;
  private tokenizer!: Tokenizer;
  private openElementStack = new OpenElementStack();
  private running = true;

  constructor() {}

  public parse(html: string): Root {
    this.html = html;
    this.tokenizer = Tokenizer.create(this.html);
    this.createRoot();

    while (this.running) {
      const token = this.tokenizer.getNextToken();
      if (!token) {
        break;
      }
      this.process(token);
    }

    return this.root;
  }

  private createRoot() {
    this.root = new Root();
    this.openElementStack.push(this.root);
  }

  private insertCommentNodeToRoot(node: CommentNode) {
    this.insertToCurrent(node);
    this.root.comments.push(node);
  }

  private insertToCurrent(node: AnyNode) {
    this.openElementStack.top.children.push(node);
  }

  private pushToOpenStack(node: any) {
    debugger;
    this.openElementStack.push(node);
  }

  private popFromOpenStackUntilTagName(tagName: string): any[] {
    let unclosedElements: any[] = [];
    for (let i = this.openElementStack.stackTop; i > 0; i--) {
      const element = this.openElementStack.elements[i];
      if (element.tagName === tagName) {
        unclosedElements = this.openElementStack.popUntilElementPopped(element);
      }
    }
    return unclosedElements;
  }

  private process(token: AnyHtmlToken) {
    if (token.type === HtmlTokenType.Comment) {
      const commentNode = CommentNode.fromToken(token);
      this.insertCommentNodeToRoot(commentNode);
    } else if (token.type === HtmlTokenType.Doctype) {
      const doctypeNode = DoctypeNode.fromToken(token);
      this.insertToCurrent(doctypeNode);
    } else if (token.type === HtmlTokenType.StartTag) {
      const tagNode = TagNode.fromToken(token);
      if (!token.selfClosing) {
        this.pushToOpenStack(tagNode);
      } else {
        this.insertToCurrent(tagNode);
      }
      tagNode.selfClosing = token.selfClosing;
    } else if (token.type === HtmlTokenType.EndTag) {
      const endTagNode = EndTagNode.fromToken(token);

      const poppedElements = this.popFromOpenStackUntilTagName(
        token.tagName.value
      );

      const lastElement = utils.last(poppedElements);
      lastElement.endTag = endTagNode;

      this.insertToCurrent(lastElement);

      if (poppedElements.length) {
        for (let i = poppedElements.length - 2; i >= 0; i--) {
          lastElement.children.push(poppedElements[i]);
        }
      }
    } else if (token.type === HtmlTokenType.EOF) {
      const poppedElements = this.openElementStack.popUntilBeforeElementPopped(
        this.root
      );
      if (poppedElements.length) {
        for (let i = poppedElements.length - 1; i >= 0; i--) {
          this.root.children.push(poppedElements[i]);
        }
      }
      this.running = false;
    }
  }
}
