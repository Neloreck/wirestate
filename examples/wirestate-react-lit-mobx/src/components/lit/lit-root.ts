import "./lit-counter";

import { ContextProvider } from "@lit/context";
import { Container } from "@wirestate/core";
import { ContainerContext } from "@wirestate/lit";
import { html, LitElement, nothing } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("w-lit-root")
export class LitRoot extends LitElement {
  private containerRef?: Container;

  private readonly provider = new ContextProvider(this, {
    context: ContainerContext,
  });

  public get container(): Container | undefined {
    return this.containerRef;
  }

  public set container(container: Container) {
    this.containerRef = container;
    this.provider.setValue(container);
    this.requestUpdate();
  }

  protected render() {
    return this.containerRef ? html`<w-lit-counter></w-lit-counter>` : nothing;
  }
}
