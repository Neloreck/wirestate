import { Container } from "inversify";

import { Inject, Injectable } from "@/wirestate/alias";
import { OnEvent } from "@/wirestate/core/events/on-event";
import { OnQuery } from "@/wirestate/core/queries/on-query";
import { WireScope } from "@/wirestate/core/scope/wire-scope";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";
import { IEvent } from "@/wirestate/types/events";
import { Maybe } from "@/wirestate/types/general";

@Injectable()
export class GenericService {
  public isActivated: boolean = false;

  public isTestStringEventReceived: boolean = false;

  public testStingEventPayload: Maybe<string> = null;

  public constructor(
    @Inject(WireScope)
    public readonly scope: WireScope
  ) {}

  @OnActivated()
  public activate(): void {
    this.isActivated = true;
  }

  @OnDeactivation()
  public deactivate(): void {
    this.isActivated = false;
  }

  public testResolveService(): GenericService {
    return this.scope.resolve(GenericService);
  }

  public testGetContainer(): Container {
    return this.scope.getContainer();
  }

  public testGetSeed(): Container {
    return this.scope.getSeed();
  }

  public testEmitEvent(): void {
    this.scope.emitEvent("TEST_EVENT", 0);
  }

  public testQueryData(): void {
    this.scope.queryData("TEST_QUERY", { data: 1 });
  }

  @OnQuery("TEST_QUERY")
  public onTestQuery(): string {
    return "query-response";
  }

  @OnEvent("TEST_STRING_EVENT")
  public onTestStringEvent(event: IEvent<string>): void {
    this.isTestStringEventReceived = true;
    this.testStingEventPayload = event.payload;
  }

  @OnQuery("TEST_STRING_QUERY")
  public onTestStringQuery(): string {
    return "string-query-response";
  }
}
