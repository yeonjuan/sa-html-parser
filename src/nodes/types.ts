import type { Comment, Element, Text, Doctype, Attribute } from "./nodes";

export type AnyNode = Element | Text | Doctype | Comment | Attribute;
