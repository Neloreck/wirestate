import { Container } from "inversify";

import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";

export class GenericService extends AbstractService {
  public isActivated: boolean = false;

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
    this.emitSignal({ type: "test", payload: 0 });
  }

  public testQueryData(): void {
    this.queryData("TYPE", { data: 1 });
  }
}
