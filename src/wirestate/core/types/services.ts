import { type Newable } from "inversify";

import { AbstractService } from "../service/AbstractService";

/**
 * Service constructor.
 */
export type TServiceClass<T extends AbstractService = AbstractService> = Newable<T>;
