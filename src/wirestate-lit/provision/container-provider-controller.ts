import { ContextProvider } from "@lit/context";
import { ReactiveController, ReactiveControllerHost } from "@lit/reactive-element";
import { createIocContainer, Container } from "@wirestate/core";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../context/ioc-context";
import { Maybe } from "../types/general";

export class ContainerProviderController implements ReactiveController {
  protected provider: ContextProvider<typeof ContainerContext>;
  protected revision: number = 1;

  public container: Container;

  public constructor(
    private readonly host: ReactiveControllerHost & HTMLElement,
    container?: Maybe<Container>
  ) {
    this.host.addController(this);

    this.container = container ?? createIocContainer();

    dbg.info(prefix(__filename), "Constructing:", {
      host: this.host,
      container: this.container,
      initContainer: container,
      revision: this.revision,
    });

    this.provider = new ContextProvider(host, {
      context: ContainerContext,
      initialValue: {
        container: this.container,
        revision: this.revision,
        nextRevision: () => this.nextRevision(),
      },
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected");
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected");
  }

  public nextRevision(): number {
    dbg.info(prefix(__filename), "Updating revision:", {
      host: this.host,
      container: this.container,
      fromRevision: this.revision,
      toRevision: this.revision + 1,
    });

    this.revision += 1;

    this.provider.setValue({
      container: this.container,
      revision: this.revision,
      nextRevision: () => this.nextRevision(),
    });

    return this.revision;
  }
}
