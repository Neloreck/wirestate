import { ReactiveElement } from "@lit/reactive-element";
import { customElement } from "lit/decorators.js";

import { ContainerProvider } from "./container-provider";
import { provideContainer } from "./provide-container";

describe("provideContainer (legacy decorator accessor)", () => {
  @customElement("ws-provide-container-setter")
  class DecoratedElement extends ReactiveElement {
    @provideContainer({ config: {} })
    public containerProvider!: ContainerProvider;
  }

  afterEach(() => {
    Array.from(document.body.childNodes).forEach((node) => node.remove());
  });

  it("ignores writes to the decorated provider property", () => {
    const element: DecoratedElement = new DecoratedElement();
    const provider: ContainerProvider = element.containerProvider;

    expect(provider).toBeInstanceOf(ContainerProvider);

    // The decorator installs a no-op setter, so assignments must not replace the provider.
    (element as unknown as { containerProvider: unknown }).containerProvider = "not-a-provider";

    expect(element.containerProvider).toBe(provider);
  });
});
