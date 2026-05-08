import { ContextConsumer } from "@lit/context";
import { ServiceIdentifier } from "@wirestate/core";
import { ReactiveController, ReactiveControllerHost } from "lit";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerContext } from "../provision/ioc-provider-context";

export class InjectionConsumptionController<T> implements ReactiveController {
  public readonly consumer: ContextConsumer<typeof ContainerContext, ReactiveControllerHost & HTMLElement>;
  public value!: T;

  public constructor(
    protected readonly host: ReactiveControllerHost & HTMLElement,
    protected readonly injectionId: ServiceIdentifier<T>
  ) {
    dbg.info(prefix(__filename), "Construct:", {
      host,
      injectionId,
    });

    this.host.addController(this);

    this.consumer = new ContextConsumer(host, {
      context: ContainerContext,
      subscribe: true,
      callback: (it) => (this.value = it.get(injectionId)),
    });
  }

  public hostConnected(): void {
    dbg.info(prefix(__filename), "Host connected:", {
      consumerValue: this.consumer.value,
      value: this.value,
    });
  }

  public hostDisconnected(): void {
    dbg.info(prefix(__filename), "Host disconnected:", {
      consumerValue: this.consumer.value,
      value: this.value,
    });
  }
}
