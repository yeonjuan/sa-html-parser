import { CommentNode, DoctypeNode, TagNode, Root } from "../nodes";
import { Tokenizer } from "../tokenizer/tokenizer";
import {
  AnyHtmlToken,
  AtomTokenType,
  HtmlTokenType,
  CommentToken,
  DoctypeToken,
  StartTagToken,
  EndTagToken,
} from "../tokens";
import { OpenElementStack } from "./open-element-stack";
import { InsertionMode } from "./types";

export class Parser {
  private root!: Root;
  private html!: string;
  private tokenizer!: Tokenizer;
  private insertionMode!: InsertionMode;
  private openElementStack = new OpenElementStack();

  constructor() {}

  public parse(html: string): Root {
    this.html = html;
    this.tokenizer = Tokenizer.create(this.html);
    this.insertionMode = InsertionMode.initialMode;
    this.createRoot();

    while (true) {
      const token = this.tokenizer.getNextToken();
      if (!token || token.type === HtmlTokenType.EOF) {
        break;
      }
      this[this.insertionMode](token);
    }

    return this.root;
  }

  private createRoot() {
    this.root = new Root(0, 0, {
      start: {
        column: 0,
        line: 0,
      },
      end: {
        column: 0,
        line: 0,
      },
    });
  }

  private insertComment(token: CommentToken) {
    this.root.comments.push(CommentNode.fromToken(token));
  }

  private insertDoctype(token: DoctypeToken) {
    this.root.children.push(DoctypeNode.fromToken(token));
  }

  private insertElement(token: StartTagToken) {
    const element = TagNode.fromToken(token);
    this.attachElementToTree(element);
    this.openElementStack.push(element);
  }

  private handleEndTagInBody(token: EndTagToken) {
    const tagName = token.tagName.value;
    for (let i = this.openElementStack.stackTop; i > 0; i--) {
      const element = this.openElementStack.elements[i];
      if (element.tagName === tagName) {
        this.openElementStack.popUntilElementPopped(element);
        break;
      }
    }
  }

  private attachElementToTree(child: any) {
    this.openElementStack.current.push(child);
  }

  private switchModeTo(mode: InsertionMode) {
    this.insertionMode = mode;
  }

  private [InsertionMode.initialMode](token: AnyHtmlToken) {
    if (token.type === HtmlTokenType.CharacterLike) {
      if (token.value.type === AtomTokenType.WhiteSpaces) {
        // ignore token
      }
    } else if (token.type === HtmlTokenType.Comment) {
      this.insertComment(token);
    } else if (token.type === HtmlTokenType.Doctype) {
      this.insertDoctype(token);
      this.switchModeTo(InsertionMode.afterInitialMode);
    }
  }

  private [InsertionMode.afterInitialMode](token: AnyHtmlToken) {
    if (
      token.type === HtmlTokenType.CharacterLike &&
      token.value.type === AtomTokenType.WhiteSpaces
    ) {
    } else if (token.type === HtmlTokenType.Comment) {
      this.insertComment(token);
    } else if (token.type === HtmlTokenType.StartTag) {
      this.insertElement(token);
    } else if (token.type === HtmlTokenType.EndTag) {
      this.handleEndTagInBody(token);
    }
  }
}
