import { createHotFooter, createHotHeader, transformHotModule } from "./hot-transform";

describe("createHotHeader", () => {
  it("should open the module under its id without a trailing newline", () => {
    const header: string = createHotHeader("src/services/counter.ts");

    expect(header).toBe('if (import.meta.hot) __wirestate_hot__.openHotModule("src/services/counter.ts");');
    expect(header).not.toContain("\n");
  });

  it("should escape module ids as JSON strings", () => {
    expect(createHotHeader('weird "path".ts')).toContain('openHotModule("weird \\"path\\".ts")');
  });
});

describe("createHotFooter", () => {
  it("should import the hot runtime, close the module and self-accept on participation", () => {
    const footer: string = createHotFooter();

    expect(footer.startsWith("\n")).toBe(true);
    expect(footer).toContain('import * as __wirestate_hot__ from "@wirestate/core/hot"');
    expect(footer).toContain("if (import.meta.hot && __wirestate_hot__.closeHotModule())");
    expect(footer).toContain("import.meta.hot.accept(() => __wirestate_hot__.requestHotSwap())");
  });
});

describe("transformHotModule", () => {
  it("should wrap a module mentioning Injectable in header and footer", () => {
    const code: string = `
import { Injectable } from "@wirestate/core";

@Injectable()
export class CounterService {}
`;

    const transformed: ReturnType<typeof transformHotModule> = transformHotModule(code, "src/services/counter.ts");

    expect(transformed).toBe(createHotHeader("src/services/counter.ts") + code + createHotFooter());
  });

  it("should keep the original line numbers", () => {
    const code: string = "line one\nline two\n";
    const transformed: string = transformHotModule(`import { Injectable } from "x";\n${code}`, "m.ts") as string;
    const lines: Array<string> = transformed.split("\n");

    expect(lines[0]).toContain('import { Injectable } from "x";');
    expect(lines[1]).toBe("line one");
    expect(lines[2]).toBe("line two");
  });

  it("should keep a byte order mark in front of the header", () => {
    const transformed: string = transformHotModule('﻿import { Injectable } from "x";', "m.ts") as string;

    expect(transformed.startsWith("﻿if (import.meta.hot)")).toBe(true);
    expect(transformed.indexOf("﻿", 1)).toBe(-1);
  });

  it("should wrap aliased imports since detection happens at runtime", () => {
    const code: string = `
import { Injectable as Service } from "@wirestate/core";

@Service()
export class CounterService {}
`;

    expect(transformHotModule(code, "src/counter.ts")).toContain('openHotModule("src/counter.ts")');
  });

  it("should leave modules that cannot declare injectable classes untouched", () => {
    expect(transformHotModule("export const value = 42;", "src/constants.ts")).toBeNull();
    expect(transformHotModule("export class Plain {}", "src/plain.ts")).toBeNull();
    expect(transformHotModule("", "src/empty.ts")).toBeNull();
  });
});
