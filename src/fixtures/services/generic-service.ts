import { Container } from "inversify";

import { OnQuery } from "@/wirestate/core/queries/on-query";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";
import { OnSignal } from "@/wirestate/core/signals/on-signal";
import { Maybe } from "@/wirestate/types/general";
import { ISignal } from "@/wirestate/types/signals";

export class GenericService extends AbstractService {
  public isActivated: boolean = false;

  public isTestStringSignalReceived: boolean = false;

  public testStingSignalPayload: Maybe<string> = null;

  @OnActivated()
  public activate(): void {
    this.isActivated = true;
  }

  @OnDeactivation()
  public deactivate(): void {
    this.isActivated = false;
  }

  public testResolveService(): GenericService {
    return this.resolve(GenericService);
  }

  public testGetContainer(): Container {
    return this.getContainer();
  }

  public testGetSeed(): Container {
    return this.getSeed();
  }

  public testEmitSignal(): void {
    this.emitSignal("TEST_SIGNAL", 0);
  }

  public testQueryData(): void {
    this.queryData("TEST_QUERY", { data: 1 });
  }

  @OnQuery("TEST_QUERY")
  public onTestQuery(): string {
    return "query-response";
  }

  @OnSignal("TEST_STRING_SIGNAL")
  public onTestStringSignal(signal: ISignal<string>): void {
    this.isTestStringSignalReceived = true;
    this.testStingSignalPayload = signal.payload;
  }

  @OnQuery("TEST_STRING_QUERY")
  public onTestStringQuery(): string {
    return "string-query-response";
  }
}
