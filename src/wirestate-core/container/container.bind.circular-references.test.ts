import { Injectable } from "../metadata/metadata-injectable";

import { Container } from "./container";
import { inject } from "./container-context";

describe("forward references with inject()", () => {
  it("resolves a dependency that is declared after its consumer", () => {
    interface Logger {
      readonly label: string;
    }

    // inject() runs at construction time, not at class definition time,
    // so referencing a class declared later in the module needs no forwardRef.
    @Injectable()
    class ConsumerService {
      public constructor(public readonly logger: Logger = inject(LoggerService)) {}
    }

    @Injectable()
    class LoggerService implements Logger {
      public readonly label: string = "logger";
    }

    const container: Container = new Container({ bindings: [ConsumerService, LoggerService] });

    const consumer: ConsumerService = container.get(ConsumerService);

    expect(consumer.logger).toBeInstanceOf(LoggerService);
    expect(consumer.logger).toBe(container.get(LoggerService));
    expect(consumer.logger.label).toBe("logger");
  });

  it("resolves circular dependencies through lazy injection", () => {
    @Injectable()
    class FirstService {
      public constructor(private readonly second: () => SecondService = inject(SecondService, { lazy: true })) {}

      public getSecond(): SecondService {
        return this.second();
      }
    }

    @Injectable()
    class SecondService {
      public constructor(public readonly first: FirstService = inject(FirstService)) {}
    }

    const container: Container = new Container({ bindings: [FirstService, SecondService] });

    const first: FirstService = container.get(FirstService);

    expect(first.getSecond()).toBe(container.get(SecondService));
    expect(first.getSecond().first).toBe(first);
  });

  it("still detects a service's own cycle after it swallowed an unrelated circular error", () => {
    let constructions: number = 0;
    let detected: boolean = false;

    @Injectable()
    class CycleService {
      public constructor(public readonly self: CycleService = inject(CycleService)) {}
    }

    @Injectable()
    class RootService {
      public constructor() {
        constructions += 1;

        // A swallowed circular error must not un-track RootService itself...
        try {
          inject(CycleService);
        } catch {
          // Swallowed, as user code may legitimately do around an optional dependency.
        }

        // ...otherwise this self-reference recurses until the stack overflows.
        try {
          inject(RootService);
        } catch {
          detected = true;
        }
      }
    }

    const container: Container = new Container({ bindings: [RootService, CycleService] });

    container.get(RootService);

    expect(constructions).toBe(1);
    expect(detected).toBe(true);
  });
});
