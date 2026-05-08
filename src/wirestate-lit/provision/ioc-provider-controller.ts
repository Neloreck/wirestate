import { ContextProvider } from "@lit/context";
import { createIocContainer, Container } from "@wirestate/core";
import { LitElement, ReactiveController, ReactiveControllerHost } from "lit";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Maybe } from "../types/general";

import { ContainerContext } from "./ioc-provider-context";

export class IocProviderController implements ReactiveController {
  public provider: ContextProvider<typeof ContainerContext>;
  public container: Container;

  public constructor(
    private readonly host: ReactiveControllerHost & LitElement,
    container?: Maybe<Container>
  ) {
    this.host.addController(this);

    this.container = container ?? createIocContainer();

    this.provider = new ContextProvider(host, {
      context: ContainerContext,
      initialValue: this.container,
    });

    this.provider.setValue(this.container);
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected");
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected");
  }

  public get value(): Container {
    return this.container;
  }
}
