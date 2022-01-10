import type { CommentNode, TagNode, TextNode, DoctypeNode } from "./nodes";

export type AnyNode = TagNode | TextNode | DoctypeNode | CommentNode;
