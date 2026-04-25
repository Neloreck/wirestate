import { Container } from "inversify";

import { Inject, Injectable } from "@/wirestate/alias";
import { OnQuery } from "@/wirestate/core/queries/on-query";
import { WireScope } from "@/wirestate/core/scope/wire-scope";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";
import { OnSignal } from "@/wirestate/core/signals/on-signal";
import { Maybe } from "@/wirestate/types/general";
import { ISignal } from "@/wirestate/types/signals";

@Injectable()
export class GenericService {
  public isActivated: boolean = false;

  public isTestStringSignalReceived: boolean = false;

  public testStingSignalPayload: Maybe<string> = null;

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

  public testEmitSignal(): void {
    this.scope.emitSignal("TEST_SIGNAL", 0);
  }

  public testQueryData(): void {
    this.scope.queryData("TEST_QUERY", { data: 1 });
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
