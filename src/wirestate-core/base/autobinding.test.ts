import { Container } from "./container";
import { injectable } from "./decorators";
import { InjectionToken } from "./tokens";

const myServiceConstructorSpy = jest.fn();

@injectable()
class MyService {
  public constructor(public name = "MyService") {
    myServiceConstructorSpy();
  }
}

describe("Auto-binding", () => {
  afterEach(() => {
    myServiceConstructorSpy.mockReset();
  });

  it("Annotated classes should bind automatically and be constructed once", () => {
    const container = new Container();

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MyService)).not.toThrow();

    const myService = container.get(MyService);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MyService)).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });

  it("Injection tokens with factories should bind automatically and be constructed once", async () => {
    const container = new Container();

    const MY_SERVICE = new InjectionToken<MyService>("MyService", {
      factory: () => new MyService(),
    });

    expect(myServiceConstructorSpy).not.toHaveBeenCalled();
    expect(() => container.get(MY_SERVICE)).not.toThrow();

    const myService = container.get(MY_SERVICE);

    expect(myService).toBeInstanceOf(MyService);
    expect(container.get(MY_SERVICE)).toBe(myService);
    expect(myServiceConstructorSpy).toHaveBeenCalledTimes(1);
  });
});
