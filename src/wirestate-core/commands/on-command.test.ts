import { getCommandHandlerMetadata } from "@/wirestate-core/commands/get-command-handler-metadata";
import { OnCommand } from "@/wirestate-core/commands/on-command";

describe("OnCommand and getCommandHandlerMetadata", () => {
  it("should collect metadata for a single class", () => {
    class TestService {
      @OnCommand("COMMAND_FIRST")
      public onFirstCommand(): void {}

      @OnCommand("COMMAND_SECOND")
      public onSecondCommand(): void {}

      // @ts-ignore - Sabotage with non-function
      @OnCommand("COMMAND_CORRUPTED")
      public corrupted: string = "";
    }

    expect(getCommandHandlerMetadata(new TestService())).toEqual(
      expect.arrayContaining([
        { type: "COMMAND_FIRST", methodName: "onFirstCommand" },
        { type: "COMMAND_SECOND", methodName: "onSecondCommand" },
      ])
    );
  });

  it("should collect metadata across class hierarchy (parent first)", () => {
    class BaseService {
      @OnCommand("BASE_COMMAND")
      public onBase(): void {}
    }

    class DerivedService extends BaseService {
      @OnCommand("DERIVED_COMMAND")
      public onDerived(): void {}
    }

    expect(getCommandHandlerMetadata(new DerivedService())).toEqual([
      { type: "BASE_COMMAND", methodName: "onBase" },
      { type: "DERIVED_COMMAND", methodName: "onDerived" },
    ]);
  });

  it("should handle classes without commands", () => {
    class NoCommandService {}

    expect(getCommandHandlerMetadata(new NoCommandService())).toEqual([]);
  });

  it("should handle deep hierarchy", () => {
    class A {
      @OnCommand("A")
      public a(): void {}
    }

    class B extends A {
      @OnCommand("B")
      public b(): void {}
    }

    class C extends B {
      @OnCommand("C")
      public c(): void {}
    }

    expect(getCommandHandlerMetadata(new C()).map((it) => it.type)).toEqual(["A", "B", "C"]);
  });
});
