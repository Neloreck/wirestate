import { Inject, Injectable, Container } from "../../wirestate-core/alias";
import { OnActivated } from "../../wirestate-core/bind/instance/on-activated";
import { OnDeactivation } from "../../wirestate-core/bind/instance/on-deactivation";
import { OnCommand } from "../../wirestate-core/commands/on-command";
import { WireScope } from "../../wirestate-core/container/wire-scope";
import { OnEvent } from "../../wirestate-core/events/on-event";
import { OnQuery } from "../../wirestate-core/queries/on-query";
import { WireEvent } from "../../wirestate-core/types/events";
import { Maybe } from "../../wirestate-core/types/general";

@Injectable()
export class GenericService {
  public isActivated: boolean = false;

  public isTestStringEventReceived: boolean = false;

  public testStingEventPayload: Maybe<string> = null;

  public value: string = "test-value";

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

  public getValue(): string {
    return this.value;
  }

  public testResolveService(): GenericService {
    return this.scope.resolve(GenericService);
  }

  public testGetContainer(): Container {
    return this.scope.resolve(Container);
  }

  public testGetSeed(): Container {
    return this.scope.getSeed();
  }

  public testEmitEvent(): void {
    this.scope.emitEvent("TEST_EVENT", 0);
  }

  public testQueryData(): void {
    this.scope.query("TEST_QUERY", { data: 1 });
  }

  public testSendSyncCommand(): void {
    this.scope.query("TEST_SYNC_COMMAND", 100);
  }

  public testSendAsyncCommand(): void {
    this.scope.query("TEST_ASYNC_COMMAND", 500);
  }

  @OnQuery("TEST_QUERY")
  public onTestQuery(): string {
    return "query-response";
  }

  @OnEvent("TEST_STRING_EVENT")
  public onTestStringEvent(event: WireEvent<string>): void {
    this.isTestStringEventReceived = true;
    this.testStingEventPayload = event.payload;
  }

  @OnQuery("TEST_STRING_QUERY")
  public onTestStringQuery(): string {
    return "string-query-response";
  }

  @OnCommand("TEST_SYNC_COMMAND")
  public onTestSyncCommand(value: number): number {
    return 1000 + value;
  }

  @OnCommand("TEST_ASYNC_COMMAND")
  public onTestAsyncCommand(value: number): Promise<number> {
    return new Promise((resolve) => {
      resolve(1000 + value);
    });
  }
}
