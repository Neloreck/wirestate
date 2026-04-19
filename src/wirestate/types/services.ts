import { type Newable } from "inversify";

import { AbstractService } from "@/wirestate/core/service/abstract-service";

/**
 * Service constructor.
 */
export type TServiceClass<T extends AbstractService = AbstractService> = Newable<T>;
