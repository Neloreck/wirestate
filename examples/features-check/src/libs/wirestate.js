"use no memo";
import {
  LazyServiceIdentifier,
  bindingScopeValues,
  injectable,
  bindingTypeValues,
  Container,
} from "inversify";
export {
  bindingTypeValues as BindingType,
  Container,
  ContainerModule,
  inject as Inject,
  injectable as Injectable,
  multiInject as MultiInject,
  named as Named,
  optional as Optional,
  postConstruct as PostConstruct,
  preDestroy as PreDestroy,
  bindingScopeValues as ScopeBindingType,
  tagged as Tagged,
} from "inversify";
import { observable, action, computed } from "mobx";
export {
  autorun,
  comparer,
  configure,
  flow,
  flowResult,
  isAction,
  isFlow,
  isFlowCancellationError,
  isObservable,
  makeAutoObservable,
  makeObservable,
  reaction,
  runInAction,
  toJS,
  when,
} from "mobx";
export { observer } from "mobx-react-lite";
import { __decorate } from "tslib";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  createElement,
  useCallback,
  useRef,
} from "react";
function Observable() {
  return observable;
}
function ShallowObservable() {
  return observable.shallow;
}
function RefObservable() {
  return observable.ref;
}
function DeepObservable() {
  return observable.deep;
}
function Action() {
  return action;
}
function Computed() {
  return computed;
}
function forwardRef(forward) {
  return new LazyServiceIdentifier(forward);
}
const ERROR_CODE_GENERIC = 1;
const ERROR_CODE_VALIDATION_ERROR = 50;
const ERROR_CODE_INVALID_ARGUMENTS = 51;
const ERROR_CODE_INVALID_CONTEXT = 52;
const ERROR_CODE_BINDING_SCOPE = 53;
const ERROR_CODE_FAILED_TO_RESOLVE = 100;
const ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER = 101;
const ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER = 102;
const ERROR_CODE_ACCESS_BEFORE_ACTIVATION = 200;
const ERROR_CODE_ACCESS_AFTER_DISPOSAL = 201;
class WirestateError extends Error {
  name = "WirestateError";
  constructor(code = ERROR_CODE_GENERIC, detail) {
    super();
    this.code = code;
    this.message = detail || "Wirestate error.";
  }
}
function bindConstant(container, entry) {
  if (
    entry.scopeBindingType &&
    entry.scopeBindingType !== bindingScopeValues.Singleton
  ) {
    throw new WirestateError(
      ERROR_CODE_BINDING_SCOPE,
      "Provided unexpected binding scope for constant value.",
    );
  }
  container.bind(entry.id).toConstantValue(entry.value);
}
function bindDynamicValue(container, entry) {
  const binding = container.bind(entry.id).toDynamicValue(() => {
    if (entry.factory) {
      return entry.factory();
    }
    return entry.value;
  });
  if (!entry.scopeBindingType) {
    return;
  } else if (entry.scopeBindingType === bindingScopeValues.Transient) {
    binding.inTransientScope();
  } else if (entry.scopeBindingType === bindingScopeValues.Request) {
    binding.inRequestScope();
  } else {
    binding.inSingletonScope();
  }
}
const SIGNAL_BUS_TOKEN = Symbol("@wirestate/signal-bus");
const QUERY_BUS_TOKEN = Symbol("@wirestate/query-bus");
const COMMAND_BUS_TOKEN = Symbol("@wirestate/command-bus");
const SEEDS_TOKEN = Symbol("@wirestate/seeds");
const SEED_TOKEN = Symbol("@wirestate/seed");
const QUERY_HANDLER_METADATA = new WeakMap();
const COMMAND_HANDLER_METADATA = new WeakMap();
const ACTIVATED_HANDLER_METADATA = new WeakMap();
const DEACTIVATION_HANDLER_METADATA = new WeakMap();
const SIGNAL_HANDLER_METADATA = new WeakMap();
const CONTAINER_REFS_BY_SERVICE = new WeakMap();
const SIGNAL_UNSUBSCRIBERS_BY_SERVICE = new WeakMap();
const QUERY_UNREGISTERS_BY_SERVICE = new WeakMap();
const COMMAND_UNREGISTERS_BY_SERVICE = new WeakMap();
function getCommandHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (
    typeof constructor === "function" &&
    constructor !== Object &&
    constructor !== Function.prototype
  ) {
    const own = COMMAND_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}
function getQueryHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (
    typeof constructor === "function" &&
    constructor !== Object &&
    constructor !== Function.prototype
  ) {
    const own = QUERY_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}
let WireScope = class WireScope {
  isDisposed = false;
  constructor(container) {
    this.container = container;
  }
  getContainer() {
    if (this.container) {
      return this.container;
    }
    if (this.isDisposed) {
      throw new WirestateError(
        ERROR_CODE_ACCESS_AFTER_DISPOSAL,
        "WireContext::container accessed after deactivation. " +
          "Ensure service is properly disposed and MobX refs are observing latest services.",
      );
    } else {
      throw new WirestateError(
        ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
        "WireContext::container accessed before activation. " +
          "Ensure service is bound to container and is properly resolved.",
      );
    }
  }
  resolve(injectionId) {
    return this.getContainer().get(injectionId);
  }
  emitSignal(type, payload, from) {
    this.getContainer()
      .get(SIGNAL_BUS_TOKEN)
      .emit({
        type,
        payload,
        from: from === undefined ? this : from,
      });
  }
  queryData(type, data) {
    return this.getContainer().get(QUERY_BUS_TOKEN).query(type, data);
  }
  executeCommand(type, data) {
    return this.getContainer().get(COMMAND_BUS_TOKEN).command(type, data);
  }
  getSeed(seed) {
    return seed
      ? this.getContainer().get(SEEDS_TOKEN).get(seed) || null
      : this.getContainer().get(SEED_TOKEN);
  }
};
WireScope = __decorate([injectable()], WireScope);
function getActivatedHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (
    typeof constructor === "function" &&
    constructor !== Object &&
    constructor !== Function.prototype
  ) {
    const own = ACTIVATED_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}
function getDeactivationHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (
    typeof constructor === "function" &&
    constructor !== Object &&
    constructor !== Function.prototype
  ) {
    const own = DEACTIVATION_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}
function getSignalHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (
    typeof constructor === "function" &&
    constructor !== Object &&
    constructor !== Function.prototype
  ) {
    const own = SIGNAL_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}
function buildSignalDispatcher(instance) {
  const entries = [];
  for (const meta of getSignalHandlerMetadata(instance)) {
    const method = instance[meta.methodName];
    if (typeof method === "function") {
      entries.push({
        types: meta.types,
        handler: method.bind(instance),
      });
    }
  }
  if (entries.length) {
    return (signal) => {
      for (const entry of entries) {
        if (entry.types === null || entry.types.includes(signal.type)) {
          entry.handler(signal);
        }
      }
    };
  } else {
    return null;
  }
}
const WIRE_SCOPES_BY_SERVICE = new WeakMap();
function bindService(container, entry, options) {
  const whenBind = container.bind(entry).to(entry).inSingletonScope();
  if (options?.isWithIgnoreLifecycle) {
    return;
  }
  whenBind.onActivation((context, instance) => {
    instance.IS_DISPOSED = false;
    CONTAINER_REFS_BY_SERVICE.set(instance, container);
    _attachWireScopes(instance, entry);
    const dispatcher = buildSignalDispatcher(instance);
    if (dispatcher) {
      _attachSignalSub(instance, dispatcher);
    }
    const queryBus = container.get(QUERY_BUS_TOKEN);
    for (const meta of getQueryHandlerMetadata(instance)) {
      const method = instance[meta.methodName];
      if (typeof method !== "function") {
        continue;
      }
      const unregister = queryBus.register(meta.type, method.bind(instance));
      _attachQueryUnreg(instance, unregister);
    }
    const commandBus = container.get(COMMAND_BUS_TOKEN);
    for (const meta of getCommandHandlerMetadata(instance)) {
      const method = instance[meta.methodName];
      if (typeof method !== "function") {
        continue;
      }
      const unregister = commandBus.register(meta.type, method.bind(instance));
      _attachCommandUnregister(instance, unregister);
    }
    for (const methodName of getActivatedHandlerMetadata(instance)) {
      const method = instance[methodName];
      if (typeof method !== "function") {
        continue;
      }
      const result = method.call(instance);
      if (result && typeof result.then === "function") {
        result.catch((error) => {
          console.error(
            "[wirestate] @OnActivated rejected for:",
            entry.name,
            String(methodName),
            error,
          );
        });
      }
    }
    return instance;
  });
  whenBind.onDeactivation((instance) => {
    for (const methodName of getDeactivationHandlerMetadata(instance)) {
      const method = instance[methodName];
      if (typeof method === "function") {
        method.call(instance);
      }
    }
    instance.IS_DISPOSED = true;
    _detachWireScopes(instance);
    _detachCommandUnregister(instance);
    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);
  });
}
function _attachSignalSub(service, handler) {
  const bus = CONTAINER_REFS_BY_SERVICE.get(service)?.get(SIGNAL_BUS_TOKEN);
  if (bus) {
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.set(service, bus.subscribe(handler));
  }
}
function _detachSignalSub(service) {
  const unsubscribe = SIGNAL_UNSUBSCRIBERS_BY_SERVICE.get(service);
  if (unsubscribe) {
    unsubscribe();
    SIGNAL_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}
function _attachWireScopes(service, entry) {
  const paramTypes = Reflect.getMetadata("design:paramtypes", entry);
  if (!paramTypes?.some((type) => type === WireScope)) {
    return;
  }
  const scopes = [];
  for (const key of Object.getOwnPropertyNames(service)) {
    const value = service[key];
    if (value?.constructor === WireScope) {
      scopes.push(value);
    }
  }
  if (scopes.length > 0) {
    WIRE_SCOPES_BY_SERVICE.set(service, scopes);
  }
}
function _detachWireScopes(service) {
  const scopes = WIRE_SCOPES_BY_SERVICE.get(service);
  if (!scopes) {
    return;
  }
  for (const scope of scopes) {
    scope.isDisposed = true;
    scope.container = null;
  }
  WIRE_SCOPES_BY_SERVICE.delete(service);
}
function _attachQueryUnreg(service, unregister) {
  let list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }
  list.push(unregister);
}
function _detachQueryUnregs(service) {
  const list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    return;
  }
  for (const unregister of list) {
    try {
      unregister();
    } catch (error) {
      console.error("[wirestate] query unregister threw:", error);
    }
  }
  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}
function _attachCommandUnregister(service, unregister) {
  let list = COMMAND_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    list = [];
    COMMAND_UNREGISTERS_BY_SERVICE.set(service, list);
  }
  list.push(unregister);
}
function _detachCommandUnregister(service) {
  const list = COMMAND_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    return;
  }
  for (const unregister of list) {
    try {
      unregister();
    } catch (error) {
      console.error("[wirestate] command unregister threw:", error);
    }
  }
  COMMAND_UNREGISTERS_BY_SERVICE.delete(service);
}
function bindEntry(container, entry) {
  if (typeof entry === "function") {
    bindService(container, entry);
    return;
  }
  if (
    !entry.bindingType ||
    entry.bindingType === bindingTypeValues.ConstantValue
  ) {
    bindConstant(container, entry);
    return;
  }
  if (entry.bindingType === bindingTypeValues.DynamicValue) {
    bindDynamicValue(container, entry);
    return;
  }
  bindService(container, entry.value);
}
var ECommandStatus;
(function (ECommandStatus) {
  ECommandStatus["PENDING"] = "pending";
  ECommandStatus["SETTLED"] = "settled";
  ECommandStatus["ERROR"] = "error";
})(ECommandStatus || (ECommandStatus = {}));
class CommandBus {
  handlers = new Map();
  register(type, handler) {
    let stack = this.handlers.get(type);
    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }
    stack.push(handler);
    return () => {
      const current = this.handlers.get(type);
      if (!current) {
        return;
      }
      const index = current.indexOf(handler);
      if (index >= 0) {
        current.splice(index, 1);
      }
      if (current.length === 0) {
        this.handlers.delete(type);
      }
    };
  }
  command(type, data) {
    const stack = this.handlers.get(type);
    if (!stack?.length) {
      throw new WirestateError(
        ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER,
        `No command handler registered in container for type: '${String(type)}'.`,
      );
    }
    const handler = stack[stack.length - 1];
    const descriptor = {
      task: null,
      status: ECommandStatus.PENDING,
    };
    descriptor.task = Promise.resolve()
      .then(() => handler(data))
      .then((result) => {
        descriptor.status = ECommandStatus.SETTLED;
        return result;
      })
      .catch((error) => {
        descriptor.status = ECommandStatus.ERROR;
        throw error;
      });
    return descriptor;
  }
  commandOptional(type, data) {
    const stack = this.handlers.get(type);
    return stack?.length ? this.command(type, data) : null;
  }
  has(type) {
    return Boolean(this.handlers.get(type)?.length);
  }
  clear() {
    this.handlers.clear();
  }
}
class QueryBus {
  handlers = new Map();
  register(type, handler) {
    let stack = this.handlers.get(type);
    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }
    stack.push(handler);
    return () => {
      const current = this.handlers.get(type);
      if (!current) {
        return;
      }
      const index = current.indexOf(handler);
      if (index >= 0) {
        current.splice(index, 1);
      }
      if (current.length === 0) {
        this.handlers.delete(type);
      }
    };
  }
  query(type, data) {
    const stack = this.handlers.get(type);
    if (stack?.length) {
      return stack[stack.length - 1](data);
    }
    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER,
      `No query handler registered in container for type: '${String(type)}'.`,
    );
  }
  queryOptional(type, data) {
    const stack = this.handlers.get(type);
    if (stack?.length) {
      return stack[stack.length - 1](data);
    }
    return null;
  }
  has(type) {
    const stack = this.handlers.get(type);
    return Boolean(stack && stack.length);
  }
  clear() {
    this.handlers.clear();
  }
}
class SignalBus {
  handlers = new Set();
  emit(signal) {
    const snapshot = Array.from(this.handlers);
    for (const handler of snapshot) {
      try {
        handler(signal);
      } catch (error) {
        console.error("[wirestate] Signal handler threw:", error);
      }
    }
  }
  subscribe(handler) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
  clear() {
    this.handlers.clear();
  }
}
function createIocContainer(options = {}) {
  const container = new Container({
    defaultScope: "Singleton",
    parent: options.parent,
  });
  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(COMMAND_BUS_TOKEN).toConstantValue(new CommandBus());
  container.bind(SEEDS_TOKEN).toConstantValue(new Map());
  container.bind(SEED_TOKEN).toConstantValue({});
  container
    .bind(WireScope)
    .toResolvedValue(() => new WireScope(container))
    .inTransientScope();
  return container;
}
function command(container, type, data) {
  return container.get(COMMAND_BUS_TOKEN).command(type, data);
}
function commandOptional(container, type, data) {
  return container.get(COMMAND_BUS_TOKEN).commandOptional(type, data);
}
function emitSignal(container, type, payload, from) {
  container.get(SIGNAL_BUS_TOKEN).emit({
    type,
    payload,
    from,
  });
}
function query(container, type, data) {
  return container.get(QUERY_BUS_TOKEN).query(type, data);
}
function queryOptional(container, type, data) {
  return container.get(QUERY_BUS_TOKEN).queryOptional(type, data);
}
function getEntryToken(entry) {
  return typeof entry === "function" ? entry : entry.id;
}
function applySeeds(container, seeds) {
  const existing = container.get(SEEDS_TOKEN);
  for (const [key, state] of seeds) {
    existing.set(key, state);
  }
}
function unapplySeeds(container, seeds) {
  const existing = container.get(SEEDS_TOKEN);
  for (const [key] of seeds) {
    existing.delete(key);
  }
}
const IocContext = createContext(null);
IocContext.displayName = "IocContext";
function createInjectablesProvider(entries, options = {}) {
  const { activate } = options;
  if (activate && activate.length > 0) {
    const entryTokens = entries.map(getEntryToken);
    for (const eager of activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(
          ERROR_CODE_VALIDATION_ERROR,
          `createInjectablesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`,
        );
      }
    }
  }
  function InjectablesProviderComponent(props) {
    const iocContext = useContext(IocContext);
    if (!iocContext) {
      throw new WirestateError(
        ERROR_CODE_INVALID_CONTEXT,
        "<InjectablesProvider> must be rendered inside an <IocProvider> React subtree.",
      );
    }
    const [initialPropsSnapshot] = useState(() => props);
    useMemo(() => {
      if (initialPropsSnapshot.seeds) {
        applySeeds(iocContext.container, initialPropsSnapshot.seeds);
      }
      for (const entry of entries) {
        if (!iocContext.container.isBound(getEntryToken(entry))) {
          bindEntry(iocContext.container, entry);
        }
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
    }, entries);
    useEffect(() => {
      let didRebind = false;
      if (initialPropsSnapshot.seeds) {
        applySeeds(iocContext.container, initialPropsSnapshot.seeds);
      }
      for (const entry of entries) {
        if (!iocContext.container.isBound(getEntryToken(entry))) {
          didRebind = true;
          bindEntry(iocContext.container, entry);
        }
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
      if (didRebind) {
        iocContext.setRevision((r) => r + 1);
      }
      return () => {
        for (const entry of entries) {
          const token = getEntryToken(entry);
          if (iocContext.container.isBound(token)) {
            iocContext.container.unbind(token);
          }
        }
        if (initialPropsSnapshot.seeds) {
          unapplySeeds(iocContext.container, initialPropsSnapshot.seeds);
        }
      };
    }, entries);
    return props.children;
  }
  InjectablesProviderComponent.displayName = "InjectablesProvider";
  return InjectablesProviderComponent;
}
function applySharedSeed(container, seed) {
  container.rebind(SEED_TOKEN).toConstantValue(seed);
}
function IocProvider({ container: externalContainer, seed, children }) {
  const [revision, setRevision] = useState(1);
  const [ownedContainer] = useState(() =>
    externalContainer ? null : createIocContainer(),
  );
  const container = externalContainer ?? ownedContainer;
  if (!container) {
    throw new WirestateError(
      ERROR_CODE_FAILED_TO_RESOLVE,
      "IocProvider failed to resolve a container instance.",
    );
  }
  const value = useMemo(
    () => ({
      container,
      revision,
      setRevision,
    }),
    [container, revision],
  );
  useEffect(() => {
    if (seed) {
      applySharedSeed(container, seed);
    }
  }, [container]);
  return createElement(
    IocContext.Provider,
    {
      value,
    },
    children,
  );
}
function useIocContext() {
  const value = useContext(IocContext);
  if (!value) {
    throw new WirestateError(
      ERROR_CODE_INVALID_CONTEXT,
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>.",
    );
  }
  return value;
}
function useContainer() {
  return useIocContext().container;
}
function useContainerRevision() {
  return useIocContext().revision;
}
function OnCommand(type) {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = COMMAND_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      COMMAND_HANDLER_METADATA.set(constructor, list);
    }
    list.push({
      methodName: propertyKey,
      type,
    });
  };
}
function useCommandCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(COMMAND_BUS_TOKEN).command(type, data);
    },
    [container],
  );
}
function useOptionalCommandCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(COMMAND_BUS_TOKEN).commandOptional(type, data);
    },
    [container],
  );
}
function useCommandHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container
      .get(COMMAND_BUS_TOKEN)
      .register(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
function OnQuery(type) {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = QUERY_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      QUERY_HANDLER_METADATA.set(constructor, list);
    }
    list.push({
      methodName: propertyKey,
      type,
    });
  };
}
function useQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(QUERY_BUS_TOKEN).query(type, data);
    },
    [container],
  );
}
function useOptionalQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(QUERY_BUS_TOKEN).queryOptional(type, data);
    },
    [container],
  );
}
function useQueryHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    const bus = container.get(QUERY_BUS_TOKEN);
    return bus.register(type, (data) => handlerRef.current(data));
  }, [container, type]);
}
function useSyncQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(QUERY_BUS_TOKEN).query(type, data);
    },
    [container],
  );
}
function useOptionalSyncQueryCaller() {
  const container = useContainer();
  return useCallback(
    (type, data) => {
      return container.get(QUERY_BUS_TOKEN).queryOptional(type, data);
    },
    [container],
  );
}
class AbstractService {
  IS_DISPOSED = null;
  getContainer() {
    const ref = CONTAINER_REFS_BY_SERVICE.get(this);
    if (ref) {
      return ref;
    } else {
      if (this.IS_DISPOSED) {
        throw new WirestateError(
          ERROR_CODE_ACCESS_AFTER_DISPOSAL,
          "AbstractService::container accessed after deactivation. " +
            "Ensure service is properly disposed and MobX refs are observing latest services.",
        );
      } else {
        throw new WirestateError(
          ERROR_CODE_ACCESS_BEFORE_ACTIVATION,
          "AbstractService::container accessed before activation. " +
            "Ensure service is bound to container and is properly resolved.",
        );
      }
    }
  }
  resolve(injectionId) {
    return this.getContainer().get(injectionId);
  }
  emitSignal(type, payload, from) {
    this.getContainer()
      .get(SIGNAL_BUS_TOKEN)
      .emit({
        type,
        payload,
        from: from === undefined ? this : from,
      });
  }
  queryData(type, data) {
    return this.getContainer().get(QUERY_BUS_TOKEN).query(type, data);
  }
  executeCommand(type, data) {
    return this.getContainer().get(COMMAND_BUS_TOKEN).command(type, data);
  }
  getSeed(seed) {
    return seed
      ? this.getContainer().get(SEEDS_TOKEN).get(seed) || null
      : this.getContainer().get(SEED_TOKEN);
  }
}
function OnActivated() {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = ACTIVATED_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      ACTIVATED_HANDLER_METADATA.set(constructor, list);
    }
    list.push(propertyKey);
  };
}
function OnDeactivation() {
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = DEACTIVATION_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      DEACTIVATION_HANDLER_METADATA.set(constructor, list);
    }
    list.push(propertyKey);
  };
}
function useInjection(injectionId) {
  const { container, revision } = useIocContext();
  return useMemo(() => {
    return container.get(injectionId);
  }, [container, revision, injectionId]);
}
function useOptionalInjection(injectionId) {
  const { container, revision } = useIocContext();
  return useMemo(() => {
    if (container.isBound(injectionId)) {
      return container.get(injectionId);
    } else {
      return null;
    }
  }, [container, revision, injectionId]);
}
function OnSignal(types) {
  const normalized =
    types === undefined ? null : Array.isArray(types) ? [...types] : [types];
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = SIGNAL_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(constructor, list);
    }
    list.push({
      methodName: propertyKey,
      types: normalized,
    });
  };
}
function useSignal(type, handler) {
  const signalRef = useRef(type);
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    signalRef.current = type;
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(SIGNAL_BUS_TOKEN).subscribe((signal) => {
      if (signal.type === signalRef.current) {
        handlerRef.current?.(signal);
      }
    });
  }, [container, type]);
}
function useSignals(types, handler) {
  const typesRef = useRef(types);
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(SIGNAL_BUS_TOKEN).subscribe((signal) => {
      if (typesRef.current.includes(signal.type)) {
        handlerRef.current?.(signal);
      }
    });
  }, [container]);
}
function useSignalHandler(handler) {
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(SIGNAL_BUS_TOKEN).subscribe((signal) => {
      handlerRef.current?.(signal);
    });
  }, [container]);
}
function useSignalEmitter() {
  const container = useIocContext().container;
  return useCallback(
    (type, payload, from) => {
      container.get(SIGNAL_BUS_TOKEN).emit({
        type,
        payload,
        from,
      });
    },
    [container],
  );
}
function mockBindService(container, ServiceClass, options = {}) {
  const { skipLifecycle } = options;
  return bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle,
  });
}
function mockContainer(options = {}) {
  const container = createIocContainer();
  const { activate = [], services = [] } = options;
  if (activate.length) {
    for (const token of options.activate ?? []) {
      if (!services.includes(token)) {
        throw new WirestateError(
          ERROR_CODE_INVALID_ARGUMENTS,
          "Provided services for activation not matching list of services to bind.",
        );
      }
    }
  }
  for (const service of options.services ?? []) {
    mockBindService(container, service, {
      skipLifecycle: options.skipLifecycle,
    });
  }
  for (const token of options.activate ?? []) {
    container.get(token);
  }
  return container;
}
function mockService(service, container = mockContainer(), options = {}) {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
  });
  return container.get(service);
}
function withIocProvider(children, container = mockContainer(), seed) {
  return createElement(
    IocProvider,
    {
      container,
      seed,
    },
    children,
  );
}
export {
  AbstractService,
  Action,
  ECommandStatus as CommandStatus,
  Computed,
  DeepObservable,
  IocProvider,
  Observable,
  OnActivated,
  OnCommand,
  OnDeactivation,
  OnQuery,
  OnSignal,
  RefObservable,
  SEED_TOKEN as SEED,
  ShallowObservable,
  WireScope,
  WirestateError,
  bindConstant,
  bindEntry,
  bindService,
  command,
  commandOptional,
  createInjectablesProvider,
  createIocContainer,
  emitSignal,
  forwardRef,
  mockBindService,
  mockContainer,
  mockService,
  query,
  queryOptional,
  useCommandCaller,
  useCommandHandler,
  useContainer,
  useContainerRevision,
  useInjection,
  useOptionalCommandCaller,
  useOptionalInjection,
  useOptionalQueryCaller,
  useOptionalSyncQueryCaller,
  useQueryCaller,
  useQueryHandler,
  useSignal,
  useSignalEmitter,
  useSignalHandler,
  useSignals,
  useSyncQueryCaller,
  withIocProvider,
};
