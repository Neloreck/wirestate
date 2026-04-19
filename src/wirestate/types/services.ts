import { type Newable } from "inversify";

import { AbstractService } from "@/wirestate/core/service/AbstractService";

/**
 * Service constructor.
 */
export type TServiceClass<T extends AbstractService = AbstractService> = Newable<T>;
