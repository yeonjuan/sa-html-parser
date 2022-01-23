import { DoctypeNode } from "../../nodes";
import { parse } from "../parser";

describe("parser: doctype", () => {
  test("basic", () => {
    const result = parse("<!DOCTYPE html>");
    expect(result.children.length).toBe(1);

    const [doctype] = result.children;
    expect(doctype.type).toBe("DocumentType");
    expect(doctype.start).toBe(0);
    expect(doctype.end).toBe(15);

    expect(doctype.loc.start.column).toBe(0);
    expect(doctype.loc.start.line).toBe(1);

    expect(doctype.loc.end.column).toBe(15);
    expect(doctype.loc.end.line).toBe(1);
  });

  test("publicId", () => {
    const result = parse(
      `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">`
    );
    expect(result.children.length).toBe(1);

    const [doctype] = result.children as [DoctypeNode];
    expect(doctype.type).toBe("DocumentType");

    expect(doctype.publicId?.type).toBe("DoctypeId");
    expect(doctype.publicId?.value).toBe(
      `"-//W3C//DTD HTML 4.01 Transitional//EN"`
    );
    expect(doctype.publicId?.start).toBe(22);

    expect(doctype.systemId?.type).toBe("DoctypeId");
    expect(doctype.systemId?.value).toBe(
      `"http://www.w3.org/TR/html4/loose.dtd"`
    );
  });
});
