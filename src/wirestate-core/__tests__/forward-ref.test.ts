import { Container } from "../container/container";
import { inject } from "../container/context";
import { createContainer } from "../container/create-container";
import { Injectable } from "../metadata/injectable";

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

    const container: Container = createContainer({ bindings: [ConsumerService, LoggerService] });

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

    const container: Container = createContainer({ bindings: [FirstService, SecondService] });

    const first: FirstService = container.get(FirstService);

    expect(first.getSecond()).toBe(container.get(SecondService));
    expect(first.getSecond().first).toBe(first);
  });
});
