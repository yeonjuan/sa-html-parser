import {
  CommentNode,
  DoctypeNode,
  RootNode,
  AnyNode,
  ElementNode,
  ClosingElementNode,
  TextNode,
} from "../nodes";
import { Tokenizer } from "../tokenizer/tokenizer";
import {
  AnyHtmlToken,
  AttributeToken,
  CharacterLikeToken,
  CommentToken,
  DoctypeToken,
  EndTagToken,
  EofToken,
  HtmlTokenType,
  NullToken,
  StartTagToken,
} from "../tokens";
import { OpenElementStack } from "./open-element-stack";
import * as utils from "../common/utils";
import { ParsingError, ParsingErrors } from "../common/errors";
import { Position } from "../common/types";

class Parser {
  private root!: RootNode;
  private html!: string;
  private tokenizer!: Tokenizer;
  private openElementStack = new OpenElementStack();
  private running = true;

  public static parse(html: string) {
    const parser = new Parser();
    return parser.parseHTML(html);
  }

  private parseHTML(html: string): RootNode {
    this.html = html;
    this.tokenizer = Tokenizer.create(this.html);
    this.createRoot();

    while (this.running) {
      const token = this.tokenizer.getNextToken();
      if (!token) {
        break;
      }
      if (this.tokenizer.hasError()) {
        this.root.errors.push(...this.tokenizer.flushErrors());
      }
      this.process(token);
    }

    return this.root;
  }

  private createRoot() {
    this.root = new RootNode();
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
    this.openElementStack.push(node);
  }

  private popFromOpenStackUntilTagName(tagName: string): null | any[] {
    let unclosedElements: null | any[] = null;
    for (let i = this.openElementStack.stackTop; i >= 0; i--) {
      const element: ElementNode = this.openElementStack.elements[i];
      if (element.openingElement?.name.value === tagName) {
        unclosedElements = this.openElementStack.popUntilElementPopped(element);
        break;
      }
    }
    return unclosedElements;
  }

  private process(token: AnyHtmlToken) {
    this[token.type]?.(token as any);
  }

  private parseError(error: string, pos: Position, index: number) {
    this.root.errors.push(new ParsingError(pos, index, error));
  }

  private [HtmlTokenType.Comment](token: CommentToken) {
    const comment = CommentNode.fromToken(token);
    this.insertToCurrent(comment);
    this.insertCommentNodeToRoot(comment);
  }

  private [HtmlTokenType.Doctype](token: DoctypeToken) {
    this.insertToCurrent(DoctypeNode.fromToken(token));
  }

  private [HtmlTokenType.StartTag](token: StartTagToken) {
    const tagNode = ElementNode.fromToken(token);
    this.insertToCurrent(tagNode);
    if (token.selfClosing) {
      tagNode.openingElement.selfClosing = true;
    } else {
      this.pushToOpenStack(tagNode);
    }
  }

  private [HtmlTokenType.EndTag](token: EndTagToken) {
    const closing = ClosingElementNode.fromToken(token);
    const poppedElements = this.popFromOpenStackUntilTagName(
      token.tagName.value
    );
    if (!poppedElements) {
      this.parseError(
        ParsingErrors.MissingStartElement,
        token.loc.start,
        token.start
      );
      return;
    }
    const element = utils.last<ElementNode>(poppedElements)!;
    element.children = utils.getChildrenRecursively(element);
    element.closingElement = closing;
    element.end = closing.end;
    element.loc.end = closing.loc.end;
    element.range[1] = closing.range[1];
  }

  private [HtmlTokenType.CharacterLike](token: CharacterLikeToken) {
    if (this.openElementStack.top.children?.length) {
      const lastChild: any = utils.last(this.openElementStack.top.children);
      if (lastChild.type === "Text") {
        const textNode = lastChild as TextNode;
        textNode.value += token.value.value;
        textNode.end = token.end;
        textNode.loc.end = token.value.loc.end;
        return;
      }
    }
    this.insertToCurrent(TextNode.fromToken(token));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private [HtmlTokenType.EOF](token: EofToken) {
    const poppedElements = this.openElementStack.popUntilBeforeElementPopped(
      this.root
    );
    if (poppedElements.length) {
      for (let i = poppedElements.length - 2; i >= 0; i--) {
        this.root.children.push(poppedElements[i]);
      }
    }
    this.running = false;
    const lastChild = utils.last<AnyNode>(this.root.children);
    this.root.range[1] = lastChild?.range[1] || 0;
    this.root.end = lastChild?.range[1] || 0;
    this.root.loc.end = lastChild?.loc.end || {
      column: 0,
      line: 1,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private [HtmlTokenType.Null](token: NullToken) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private [HtmlTokenType.Attribute](token: AttributeToken) {}
}

export const parse = Parser.parse;
