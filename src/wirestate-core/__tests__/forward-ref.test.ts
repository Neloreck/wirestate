import { Container, forwardRef, Inject, Injectable } from "../alias";
import { createContainer } from "../container/create-container";

describe("forwardRef", () => {
  it("resolves a dependency that is declared after its consumer", () => {
    interface Logger {
      readonly label: string;
    }

    @Injectable()
    class ConsumerService {
      public constructor(@Inject(forwardRef(() => LoggerService)) public readonly logger: Logger) {}
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
});
