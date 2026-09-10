// noinspection JSUnusedLocalSymbols

import { type Optional } from "../../types/general";

import { type QueryDispatchOptions } from "./queries";
import { QueryBus } from "./query-bus";

/**
 * Compile-time assertion: the argument must be assignable to the declared type, not a wider one.
 *
 * @param value - Value whose static type is under test.
 * @returns The same value, so the assertion can wrap an expression in place.
 */
function expectType<T>(value: T): T {
  return value;
}

describe("QueryBus dispatch typings", () => {
  it("narrows the result by the optionality the options carry", async () => {
    const bus: QueryBus = new QueryBus();

    bus.register<string, string>("ECHO", (payload) => payload);

    // Omitted or literal `false` options: the handler is required and the result is `R`.
    expectType<string>(bus.query<string, string>("ECHO", "a"));
    expectType<string>(bus.query<string, string>("ECHO", "a", { optional: false }));
    expectType<Promise<string>>(bus.queryAsync<string, string>("ECHO", "a"));

    // Literal `true`: the result may be `undefined`.
    expectType<Optional<string>>(bus.query<string, string>("ECHO", "a", { optional: true }));
    expectType<Promise<Optional<string>>>(bus.queryAsync<string, string>("ECHO", "a", { optional: true }));

    // A runtime-decided flag must not be able to promise a value that may never arrive.
    const options: QueryDispatchOptions = { optional: Math.random() < 2 };

    expectType<Optional<string>>(bus.query<string, string>("ECHO", "a", options));
    expectType<Promise<Optional<string>>>(bus.queryAsync<string, string>("ECHO", "a", options));

    // @ts-expect-error - a widened flag cannot narrow to a required result.
    const required: string = bus.query<string, string>("ECHO", "a", options);
    // @ts-expect-error - a widened flag cannot narrow to a required async result.
    const requiredAsync: Promise<string> = bus.queryAsync<string, string>("ECHO", "a", options);

    expect(required).toBe("a");
    await expect(requiredAsync).resolves.toBe("a");
  });
});
