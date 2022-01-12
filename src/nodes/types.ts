import type { CommentNode, ElementNode, TextNode, DoctypeNode } from "./nodes";

export type AnyNode = ElementNode | TextNode | DoctypeNode | CommentNode;
