import { createHotFooter, findInjectableClassNames, transformHotModule } from "./hot-transform";

describe("findInjectableClassNames", () => {
  it("should find decorated exported classes", () => {
    const code: string = `
import { Injectable } from "@wirestate/core";

@Injectable()
export class CounterService {
  public count: number = 0;
}

@Injectable()
class InternalService {}

export class PlainClass {}
`;

    expect(findInjectableClassNames(code)).toEqual(["CounterService", "InternalService"]);
  });

  it("should tolerate other decorators between Injectable and the class", () => {
    const code: string = `
@Injectable()
@Deprecated()
export abstract class LegacyService {}
`;

    expect(findInjectableClassNames(code)).toEqual(["LegacyService"]);
  });

  it("should return nothing for modules without injectable classes", () => {
    expect(findInjectableClassNames("export const value = 42;")).toEqual([]);
    expect(findInjectableClassNames("export class Plain {}")).toEqual([]);
  });

  it("should ignore classes declared inside functions and blocks", () => {
    // Registering these would emit a footer referencing a binding that does not exist at
    // module scope, and the module would fail to evaluate.
    const code: string = `
export function createService() {
  @Injectable()
  class Inner {}

  return Inner;
}

describe("suite", () => {
  it("case", () => {
    @Injectable()
    class Fixture {}
  });
});
`;

    expect(findInjectableClassNames(code)).toEqual([]);
    expect(transformHotModule(code, "src/factory.ts")).toBeNull();
  });

  it("should ignore unindented classes declared inside blocks", () => {
    const code: string = `
if (process.env.NODE_ENV === "test") {
@Injectable()
class Fixture {}
}
`;

    expect(findInjectableClassNames(code, "src/fixture.ts")).toEqual([]);
    expect(transformHotModule(code, "src/fixture.ts")).toBeNull();
  });

  it("should ignore decorator-looking text in comments and templates", () => {
    const code: string = `
/*
@Injectable()
class CommentedService {}
*/

export const example = \`
@Injectable()
class TemplateService {}
\`;
`;

    expect(findInjectableClassNames(code, "src/example.ts")).toEqual([]);
    expect(transformHotModule(code, "src/example.ts")).toBeNull();
  });

  it("should resolve an aliased Injectable import", () => {
    const code: string = `
import { Injectable as Service } from "@wirestate/core";

@Service()
export class CounterService {}
`;

    expect(findInjectableClassNames(code, "src/counter.ts")).toEqual(["CounterService"]);
    expect(transformHotModule(code, "src/counter.ts")).toContain("CounterService");
  });

  it("should parse component syntax when the caller includes component files", () => {
    const code: string = `
const element = <div />;

@Injectable()
export class ViewService {}
`;

    expect(findInjectableClassNames(code, "src/view.tsx")).toEqual(["ViewService"]);
  });

  it("should detect a named default-exported class", () => {
    const code: string = `
@Injectable()
export default class DefaultService {}
`;

    expect(findInjectableClassNames(code, "src/default-service.ts")).toEqual(["DefaultService"]);
  });

  it("should still detect module-scope classes that are not exported", () => {
    const code: string = `
@Injectable()
class Internal {}
`;

    expect(findInjectableClassNames(code)).toEqual(["Internal"]);
  });
});

describe("transformHotModule", () => {
  it("should append a registration and self-accept footer", () => {
    const code: string = `
@Injectable()
export class CounterService {}
`;

    const transformed: ReturnType<typeof transformHotModule> = transformHotModule(code, "src/services/counter.ts");

    expect(transformed).not.toBeNull();
    expect(transformed).toContain(code);
    expect(transformed).toContain('import * as __wirestate_hot__ from "@wirestate/core/hot"');
    expect(transformed).toContain('__wirestate_hot__.registerHotModule("src/services/counter.ts", { CounterService })');
    expect(transformed).toContain("import.meta.hot.accept(() => __wirestate_hot__.requestHotSwap())");
  });

  it("should leave modules without injectable classes untouched", () => {
    expect(transformHotModule("export const value = 42;", "src/constants.ts")).toBeNull();
    expect(transformHotModule("export class Plain {}", "src/plain.ts")).toBeNull();
  });

  it("should register every injectable class of a module once", () => {
    const footer: string = createHotFooter("src/services.ts", ["ServiceA", "ServiceB"]);

    expect(footer).toContain('registerHotModule("src/services.ts", { ServiceA, ServiceB })');
  });
});
