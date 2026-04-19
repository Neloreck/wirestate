import { Container } from "inversify";

import { AbstractService } from "@/wirestate/core/service/abstract-service";

export class GenericService extends AbstractService {
  public isActivated: boolean = false;

  public onActivated(): void {
    this.isActivated = true;
  }

  public testGetService() {
    return this.getService(GenericService);
  }

  public testGetContainer(): Container {
    return this.getContainer();
  }

  public testGetInitialState(): Container {
    return this.getInitialState();
  }

  public testEmitSignal(): void {
    this.emitSignal({ type: "test", payload: 0 });
  }

  public testQueryData(): void {
    this.queryData("TYPE", { data: 1 });
  }
}
