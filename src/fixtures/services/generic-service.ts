import {
  Container,
  EventBus,
  inject,
  Injectable,
  OnActivated,
  OnCommand,
  OnDeactivation,
  OnEvent,
  OnQuery,
  QueryBus,
  type WireEvent,
} from "@wirestate/core";

import { type Maybe } from "../types";

@Injectable()
export class GenericService {
  public isActivated: boolean = false;

  public isTestStringEventReceived: boolean = false;

  public testStingEventPayload: Maybe<string> = null;

  public value: string = "test-value";

  public constructor(
    public readonly container: Container = inject(Container),
    private readonly eventBus: EventBus = inject(EventBus),
    private readonly queryBus: QueryBus = inject(QueryBus)
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
    return this.container.get(GenericService);
  }

  public testGetContainer(): Container {
    return this.container.get(Container);
  }

  public testEmitEvent(): void {
    this.eventBus.emit("TEST_EVENT", 0);
  }

  public testQueryData(): void {
    this.queryBus.query("TEST_QUERY", { data: 1 });
  }

  public testSendSyncCommand(): void {
    this.queryBus.query("TEST_SYNC_COMMAND", 100);
  }

  public testSendAsyncCommand(): void {
    this.queryBus.query("TEST_ASYNC_COMMAND", 500);
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
