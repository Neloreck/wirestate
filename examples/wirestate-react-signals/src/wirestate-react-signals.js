import { LazyServiceIdentifier, bindingScopeValues, injectable, bindingTypeValues, Container } from 'inversify';
export { bindingTypeValues as BindingType, Container, ContainerModule, inject as Inject, injectFromBase as InjectFromBase, injectFromHierarchy as InjectFromHierarchy, injectable as Injectable, LazyServiceIdentifier, multiInject as MultiInject, named as Named, optional as Optional, postConstruct as PostConstruct, preDestroy as PreDestroy, bindingScopeValues as ScopeBindingType, tagged as Tagged, unmanaged as Unmanaged, bindingScopeValues, bindingTypeValues } from 'inversify';
import { __decorate, __metadata } from 'tslib';
import { createContext, useContext, useCallback, useRef, useEffect, useMemo, useState, createElement } from 'react';
export { Signal, action, batch, computed, createModel, effect, signal, untracked, useComputed, useModel, useSignal, useSignalEffect } from '@preact/signals-react';

function forwardRef(forward) {
  return new LazyServiceIdentifier(forward);
}

const ERROR_CODE_GENERIC = 1;
const ERROR_CODE_VALIDATION_ERROR = 50;
const ERROR_CODE_INVALID_ARGUMENTS = 51;
const ERROR_CODE_BINDING_SCOPE = 52;
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
  if (entry.scopeBindingType && entry.scopeBindingType !== bindingScopeValues.Singleton) {
    throw new WirestateError(ERROR_CODE_BINDING_SCOPE, "Provided unexpected binding scope for constant value.");
  }
  return container.bind(entry.id).toConstantValue(entry.value);
}

function bindDynamicValue(container, entry) {
  const binding = container.bind(entry.id).toDynamicValue(() => {
    if (entry.factory) {
      return entry.factory();
    }
    return entry.value;
  });
  if (!entry.scopeBindingType) {
    return binding;
  } else if (entry.scopeBindingType === bindingScopeValues.Transient) {
    return binding.inTransientScope();
  } else if (entry.scopeBindingType === bindingScopeValues.Request) {
    return binding.inRequestScope();
  } else {
    return binding.inSingletonScope();
  }
}

var CommandStatus;
(function (CommandStatus) {
  CommandStatus["PENDING"] = "pending";
  CommandStatus["SETTLED"] = "settled";
  CommandStatus["ERROR"] = "error";
})(CommandStatus || (CommandStatus = {}));

class CommandBus {
  handlers = new Map();
  clear() {
    this.handlers.clear();
  }
  command(type, data) {
    const stack = this.handlers.get(type);
    if (!stack?.length) {
      throw new WirestateError(ERROR_CODE_FAILED_TO_RESOLVE_COMMAND_HANDLER, `No command handler registered in container for type: '${String(type)}'.`);
    }
    const handler = stack[stack.length - 1];
    const descriptor = {
      task: null,
      status: CommandStatus.PENDING
    };
    descriptor.task = Promise.resolve().then(() => handler(data)).then(result => {
      descriptor.status = CommandStatus.SETTLED;
      return result;
    }).catch(error => {
      descriptor.status = CommandStatus.ERROR;
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
  register(type, handler) {
    let stack = this.handlers.get(type);
    if (!stack) {
      stack = [];
      this.handlers.set(type, stack);
    }
    stack.push(handler);
    return () => this.unregister(type, handler);
  }
  unregister(type, handler) {
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
  }
}

const QUERY_HANDLER_METADATA = new WeakMap();
const COMMAND_HANDLER_METADATA = new WeakMap();
const ACTIVATED_HANDLER_METADATA = new WeakMap();
const DEACTIVATION_HANDLER_METADATA = new WeakMap();
const EVENT_HANDLER_METADATA = new WeakMap();
const CONTAINER_REFS_BY_SERVICE = new WeakMap();
const WIRE_SCOPES_BY_SERVICE = new WeakMap();
const EVENT_UNSUBSCRIBERS_BY_SERVICE = new WeakMap();
const QUERY_UNREGISTERS_BY_SERVICE = new WeakMap();
const COMMAND_UNREGISTERS_BY_SERVICE = new WeakMap();

function getCommandHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = COMMAND_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}

class EventBus {
  handlers = new Set();
  emit(event) {
    const snapshot = Array.from(this.handlers);
    for (const handler of snapshot) {
      try {
        handler(event);
      } catch (error) {
        console.error("[wirestate] Event handler threw:", error);
      }
    }
  }
  subscribe(handler) {
    this.handlers.add(handler);
    return () => this.unsubscribe(handler);
  }
  unsubscribe(handler) {
    this.handlers.delete(handler);
  }
  has() {
    return this.handlers.size > 0;
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
    return () => this.unregister(type, handler);
  }
  unregister(type, handler) {
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
  }
  query(type, data) {
    const stack = this.handlers.get(type);
    if (stack?.length) {
      return stack[stack.length - 1](data);
    }
    throw new WirestateError(ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER, `No query handler registered in container for type: '${String(type)}'.`);
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

const SEEDS_TOKEN = Symbol("@wirestate/core/seeds");
const SEED_TOKEN = Symbol("@wirestate/core/seed");

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
      throw new WirestateError(ERROR_CODE_ACCESS_AFTER_DISPOSAL, "WireScope::container accessed after deactivation. Ensure service is properly disposed.");
    } else {
      throw new WirestateError(ERROR_CODE_ACCESS_BEFORE_ACTIVATION, "WireScope::container accessed before activation. " + "Ensure service is bound to container and is properly resolved.");
    }
  }
  resolve(injectionId) {
    return this.getContainer().get(injectionId);
  }
  resolveOptional(injectionId) {
    const container = this.getContainer();
    return container.isBound(injectionId) ? container.get(injectionId) : null;
  }
  emitEvent(type, payload, from) {
    this.getContainer().get(EventBus).emit({
      type,
      payload,
      from: from === undefined ? this : from
    });
  }
  subscribeToEvent(handler) {
    return this.getContainer().get(EventBus).subscribe(handler);
  }
  unsubscribeFromEvent(handler) {
    this.getContainer().get(EventBus).unsubscribe(handler);
  }
  queryData(type, data) {
    return this.getContainer().get(QueryBus).query(type, data);
  }
  queryOptionalData(type, data) {
    return this.getContainer().get(QueryBus).queryOptional(type, data);
  }
  registerQueryHandler(type, handler) {
    return this.getContainer().get(QueryBus).register(type, handler);
  }
  unregisterQueryHandler(type, handler) {
    this.getContainer().get(QueryBus).unregister(type, handler);
  }
  executeCommand(type, data) {
    return this.getContainer().get(CommandBus).command(type, data);
  }
  executeOptionalCommand(type, data) {
    return this.getContainer().get(CommandBus).commandOptional(type, data);
  }
  registerCommandHandler(type, handler) {
    return this.getContainer().get(CommandBus).register(type, handler);
  }
  unregisterCommandHandler(type, handler) {
    this.getContainer().get(CommandBus).unregister(type, handler);
  }
  getSeed(seed) {
    return seed ? this.getContainer().get(SEEDS_TOKEN).get(seed) || null : this.getContainer().get(SEED_TOKEN);
  }
};
WireScope = __decorate([injectable(), __metadata("design:paramtypes", [Object])], WireScope);

function getEventHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = EVENT_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}

function buildEventDispatcher(instance) {
  const entries = [];
  for (const meta of getEventHandlerMetadata(instance)) {
    const method = instance[meta.methodName];
    if (typeof method === "function") {
      entries.push({
        types: meta.types,
        handler: method.bind(instance)
      });
    }
  }
  if (entries.length) {
    return event => {
      for (const entry of entries) {
        if (entry.types === null || entry.types.includes(event.type)) {
          entry.handler(event);
        }
      }
    };
  } else {
    return null;
  }
}

function getQueryHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = QUERY_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}

function getActivatedHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
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
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = DEACTIVATION_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}

function bindService(container, entry, options) {
  const whenBind = container.bind(entry).to(entry).inSingletonScope();
  whenBind.onActivation((context, instance) => {
    instance.IS_DISPOSED = false;
    CONTAINER_REFS_BY_SERVICE.set(instance, container);
    attachWireScopes(instance, entry);
    const dispatcher = buildEventDispatcher(instance);
    if (dispatcher) {
      attachEventsSubscription(instance, dispatcher);
    }
    const queryBus = container.get(QueryBus);
    for (const meta of getQueryHandlerMetadata(instance)) {
      const method = instance[meta.methodName];
      if (typeof method !== "function") {
        continue;
      }
      const unregister = queryBus.register(meta.type, method.bind(instance));
      attachQueryUnregister(instance, unregister);
    }
    const commandBus = container.get(CommandBus);
    for (const meta of getCommandHandlerMetadata(instance)) {
      const method = instance[meta.methodName];
      if (typeof method !== "function") {
        continue;
      }
      const unregister = commandBus.register(meta.type, method.bind(instance));
      attachCommandUnregister(instance, unregister);
    }
    if (options?.isWithIgnoreLifecycle) ; else {
      for (const methodName of getActivatedHandlerMetadata(instance)) {
        const method = instance[methodName];
        if (typeof method !== "function") {
          continue;
        }
        const result = method.call(instance);
        if (result && typeof result.then === "function") {
          result.catch(error => {
            console.error("[wirestate] @OnActivated rejected for:", entry.name, String(methodName), error);
          });
        }
      }
    }
    return instance;
  });
  whenBind.onDeactivation(instance => {
    if (options?.isWithIgnoreLifecycle) ; else {
      for (const methodName of getDeactivationHandlerMetadata(instance)) {
        const method = instance[methodName];
        if (typeof method === "function") {
          method.call(instance);
        }
      }
    }
    instance.IS_DISPOSED = true;
    detachWireScopes(instance);
    detachCommandUnregister(instance);
    detachQueryUnregister(instance);
    detachEventSubscription(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);
  });
}
function attachEventsSubscription(service, handler) {
  const bus = CONTAINER_REFS_BY_SERVICE.get(service)?.get(EventBus);
  if (bus) {
    EVENT_UNSUBSCRIBERS_BY_SERVICE.set(service, bus.subscribe(handler));
  }
}
function detachEventSubscription(service) {
  const unsubscribe = EVENT_UNSUBSCRIBERS_BY_SERVICE.get(service);
  if (unsubscribe) {
    unsubscribe();
    EVENT_UNSUBSCRIBERS_BY_SERVICE.delete(service);
  }
}
function attachQueryUnregister(service, unregister) {
  let list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    list = [];
    QUERY_UNREGISTERS_BY_SERVICE.set(service, list);
  }
  list.push(unregister);
}
function detachQueryUnregister(service) {
  const list = QUERY_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    return;
  }
  for (const unregister of list) {
    unregister();
  }
  QUERY_UNREGISTERS_BY_SERVICE.delete(service);
}
function attachCommandUnregister(service, unregister) {
  let list = COMMAND_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    list = [];
    COMMAND_UNREGISTERS_BY_SERVICE.set(service, list);
  }
  list.push(unregister);
}
function detachCommandUnregister(service) {
  const list = COMMAND_UNREGISTERS_BY_SERVICE.get(service);
  if (!list) {
    return;
  }
  for (const unregister of list) {
    unregister();
  }
  COMMAND_UNREGISTERS_BY_SERVICE.delete(service);
}
function attachWireScopes(service, Service) {
  const paramTypes = Reflect.getMetadata("design:paramtypes", Service);
  if (!paramTypes?.some(type => type === WireScope)) {
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
function detachWireScopes(service) {
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

function bindEntry(container, entry, options = {}) {
  if (typeof entry === "function") {
    bindService(container, entry, options);
    return;
  }
  if (!entry.bindingType || entry.bindingType === bindingTypeValues.ConstantValue) {
    bindConstant(container, entry);
    return;
  }
  if (entry.bindingType === bindingTypeValues.DynamicValue) {
    bindDynamicValue(container, entry);
    return;
  }
  bindService(container, entry.value, options);
}

function getEntryToken(entry) {
  return typeof entry === "function" ? entry : entry.id;
}

function command(container, type, data) {
  return container.get(CommandBus).command(type, data);
}

function commandOptional(container, type, data) {
  return container.get(CommandBus).commandOptional(type, data);
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
      type
    });
  };
}

function applySeeds(container, seeds) {
  const existing = container.get(SEEDS_TOKEN);
  for (const [key, state] of seeds) {
    existing.set(key, state);
  }
}

function createBaseContainer(options) {
  const container = new Container({
    parent: options.parent,
    defaultScope: "Singleton"
  });
  container.bind(EventBus).toConstantValue(new EventBus());
  container.bind(QueryBus).toConstantValue(new QueryBus());
  container.bind(CommandBus).toConstantValue(new CommandBus());
  container.bind(SEEDS_TOKEN).toConstantValue(new Map());
  container.bind(SEED_TOKEN).toConstantValue(options.seed ?? {});
  if (options.seeds) {
    applySeeds(container, options.seeds);
  }
  return container;
}

function createContainer(options = {}) {
  if (options.activate && options.activate.length) {
    if (!options.entries?.length) {
      throw new WirestateError(ERROR_CODE_VALIDATION_ERROR, "Supplied activation list while entries for binding are not provided.");
    }
    const entryTokens = options.entries.map(getEntryToken);
    for (const eager of options.activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(ERROR_CODE_VALIDATION_ERROR, `createInjectablesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`);
      }
    }
  }
  const container = new Container({
    defaultScope: "Singleton",
    parent: createBaseContainer(options)
  });
  container.bind(WireScope).toResolvedValue(() => new WireScope(container)).inTransientScope();
  if (options.entries) {
    for (const entry of options.entries) {
      bindEntry(container, entry);
    }
  }
  if (options.activate) {
    for (const entry of options.activate) {
      container.get(entry);
    }
  }
  return container;
}

function emitEvent(container, type, payload, from) {
  container.get(EventBus).emit({
    type,
    payload,
    from
  });
}

function OnEvent(types) {
  const normalized = types === undefined ? null : Array.isArray(types) ? [...types] : [types];
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = EVENT_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      EVENT_HANDLER_METADATA.set(constructor, list);
    }
    list.push({
      methodName: propertyKey,
      types: normalized
    });
  };
}

function query(container, type, data) {
  return container.get(QueryBus).query(type, data);
}

function queryOptional(container, type, data) {
  return container.get(QueryBus).queryOptional(type, data);
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
      type
    });
  };
}

function applySharedSeed(container, seed) {
  container.rebind(SEED_TOKEN).toConstantValue(seed);
}

function unapplySeeds(container, seeds) {
  const existing = container.get(SEEDS_TOKEN);
  for (const [key] of seeds) {
    existing.delete(key);
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

function mockBindService(container, ServiceClass, options = {}) {
  const {
    skipLifecycle
  } = options;
  bindService(container, ServiceClass, {
    isWithIgnoreLifecycle: skipLifecycle
  });
}

function mockBindEntry(container, entry, options = {}) {
  const {
    skipLifecycle
  } = options;
  bindEntry(container, entry, {
    isWithIgnoreLifecycle: skipLifecycle
  });
}

function mockUnbindService(container, ServiceClass) {
  container.unbind(ServiceClass);
}

function mockContainer(options = {}) {
  const {
    activate = [],
    entries = [],
    skipLifecycle
  } = options;
  if (activate.length) {
    const serviceTokens = entries.map(s => getEntryToken(s));
    for (const token of activate) {
      if (!serviceTokens.includes(token)) {
        throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Provided services for activation not matching list of services to bind.");
      }
    }
  }
  const container = createContainer({
    parent: options.parent,
    seeds: options.seeds,
    seed: options.seed
  });
  for (const it of entries) {
    mockBindEntry(container, it, {
      skipLifecycle: skipLifecycle
    });
  }
  for (const it of activate) {
    container.get(it);
  }
  return container;
}

function mockService(service, container = mockContainer(), options = {}) {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle
  });
  return container.get(service);
}

const ERROR_CODE_INVALID_CONTEXT = 1052;

const ContainerReactContext = createContext(null);
ContainerReactContext.displayName = "ContainerContext";

function useContainer() {
  const value = useContext(ContainerReactContext);
  if (!value) {
    throw new WirestateError(ERROR_CODE_INVALID_CONTEXT, "Trying to access container context from React subtree not wrapped in <ContainerProvider>.");
  }
  return value;
}

function useCommandCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(CommandBus).command(type, data);
  }, [container]);
}

function useOptionalCommandCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(CommandBus).commandOptional(type, data);
  }, [container]);
}

function useCommandHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(CommandBus).register(type, data => handlerRef.current(data));
  }, [container, type]);
}

function useRootContainer(factory, deps) {
  return useMemo(() => {
    const container = factory();
    return container;
  }, deps);
}

function useScope() {
  const container = useContainer();
  return useMemo(() => {
    return container.get(WireScope);
  }, [container]);
}

function useEvent(type, handler) {
  const typeRef = useRef(type);
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    typeRef.current = type;
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(EventBus).subscribe(event => {
      if (event.type === typeRef.current) {
        handlerRef.current?.(event);
      }
    });
  }, [container, type]);
}

function useEvents(types, handler) {
  const typesRef = useRef(types);
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    typesRef.current = types;
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(EventBus).subscribe(event => {
      if (typesRef.current.includes(event.type)) {
        handlerRef.current?.(event);
      }
    });
  }, [container]);
}

function useEventsHandler(handler) {
  const handlerRef = useRef(handler);
  const container = useContainer();
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(EventBus).subscribe(event => {
      handlerRef.current?.(event);
    });
  }, [container]);
}

function useEventEmitter() {
  const container = useContainer();
  return useCallback((type, payload, from) => {
    container.get(EventBus).emit({
      type,
      payload,
      from
    });
  }, [container]);
}

function useInjection(injectionId) {
  const container = useContainer();
  return useMemo(() => {
    return container.get(injectionId);
  }, [container, injectionId]);
}

function useOptionalInjection(injectionId, onFallback) {
  const container = useContainer();
  return useMemo(() => {
    if (container.isBound(injectionId)) {
      return container.get(injectionId);
    } else if (onFallback) {
      return onFallback(container);
    } else {
      return null;
    }
  }, [container, injectionId]);
}

function shallowEqualArrays(left, right) {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < right.length; i++) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function SubContainerProvider(props) {
  const parent = useContainer();
  const stateRef = useRef(null);
  const disposedRef = useRef(new WeakSet());
  const [, forceUpdate] = useState(0);
  const dispose = container => {
    disposeOnce$1(container, disposedRef.current);
  };
  stateRef.current = reconcileSubContainerState(stateRef.current, parent, props, dispose);
  const state = stateRef.current;
  useEffect(() => {
    if (reviveSubContainer(stateRef, disposedRef.current, props.seeds)) {
      forceUpdate(version => version + 1);
    }
    return () => {
      dispose(state.container);
    };
  }, [state]);
  return createElement(ContainerReactContext.Provider, state.value, props.children ?? null);
}
function reconcileSubContainerState(current, parent, props, dispose) {
  if (current && current.parent === parent && shallowEqualArrays(props.entries, current.entries)) {
    return current;
  }
  if (current) {
    dispose(current.container);
  }
  return createSubContainer(parent, props.entries, props.seeds);
}
function createSubContainer(parent, entries, seeds) {
  const container = new Container({
    defaultScope: "Singleton",
    parent
  });
  if (seeds) {
    applySeeds(container, seeds);
  }
  for (const entry of entries) {
    bindEntry(container, entry);
  }
  return {
    parent,
    entries,
    container,
    value: {
      value: container
    }
  };
}
function reviveSubContainer(stateRef, disposed, seeds) {
  const state = stateRef.current;
  if (!state || !disposed.has(state.container)) {
    return false;
  }
  stateRef.current = createSubContainer(state.parent, state.entries, seeds);
  return true;
}
function disposeOnce$1(container, disposed, props) {
  if (disposed.has(container)) {
    return;
  }
  container.unbindAll();
  disposed.add(container);
}

function ContainerActivator(props) {
  const container = useContainer();
  const activatedContainerRef = useRef(null);
  if (activatedContainerRef.current !== container) {
    activatedContainerRef.current = container;
    for (const entry of props.activate) {
      container.get(entry);
    }
  }
  return props.children ?? null;
}

const EMPTY_ENTRIES = [];
function ContainerProvider(props) {
  const stateRef = useRef(null);
  const disposedRef = useRef(new WeakSet());
  const [, forceUpdate] = useState(0);
  const dispose = container => {
    disposeOnce(container, disposedRef.current);
  };
  const state = reconcileContainerState(stateRef.current, props.container, dispose);
  stateRef.current = state;
  useEffect(() => {
    if (reviveManagedContainer(stateRef, disposedRef.current)) {
      forceUpdate(version => version + 1);
    }
    state.unmounted = false;
    return () => {
      if (state.mode === "managed") {
        dispose(state.container);
      }
      state.unmounted = true;
    };
  }, [state]);
  return createElement(ContainerReactContext.Provider, state.value, props.children ?? null);
}
function reconcileContainerState(current, source, dispose) {
  if (source instanceof Container) {
    if (current?.mode === "managed") {
      dispose(current.container);
    }
    if (current?.mode === "external" && current.container === source) {
      return current;
    }
    return createContainerState(source);
  }
  if (current?.mode === "managed" && !current.unmounted && hasSameEntries(source, current.options)) {
    return current;
  }
  if (current?.mode === "managed") {
    dispose(current.container);
  }
  return createContainerState(source);
}
function createContainerState(source) {
  if (source instanceof Container) {
    return {
      mode: "external",
      container: source,
      options: {},
      value: {
        value: source
      },
      unmounted: false
    };
  }
  const container = createContainer(source);
  return {
    mode: "managed",
    container,
    options: source,
    value: {
      value: container
    },
    unmounted: false
  };
}
function reviveManagedContainer(stateRef, disposed) {
  const state = stateRef.current;
  if (!state || state.mode !== "managed" || !disposed.has(state.container)) {
    return false;
  }
  stateRef.current = createContainerState(state.options);
  return true;
}
function hasSameEntries(next, current) {
  return shallowEqualArrays(next.entries ?? EMPTY_ENTRIES, current.entries ?? EMPTY_ENTRIES);
}
function disposeOnce(container, disposed) {
  if (disposed.has(container)) {
    return;
  }
  container.unbindAll();
  disposed.add(container);
}

function useQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QueryBus).query(type, data);
  }, [container]);
}

function useOptionalQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QueryBus).queryOptional(type, data);
  }, [container]);
}

function useQueryHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    return container.get(QueryBus).register(type, data => handlerRef.current(data));
  }, [container, type]);
}

function useSyncQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QueryBus).query(type, data);
  }, [container]);
}

function useOptionalSyncQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QueryBus).queryOptional(type, data);
  }, [container]);
}

function withContainerProvider(children, container = mockContainer()) {
  return createElement(ContainerProvider, {
    container
  }, children);
}

export { CommandBus, CommandStatus, ContainerActivator, ContainerProvider, EventBus, OnActivated, OnCommand, OnDeactivation, OnEvent, OnQuery, QueryBus, SEED_TOKEN as SEED, SEEDS_TOKEN as SEEDS, SubContainerProvider, WireScope, WirestateError, applySeeds, applySharedSeed, bindConstant, bindDynamicValue, bindEntry, bindService, command, commandOptional, createContainer, emitEvent, forwardRef, getEntryToken, mockBindEntry, mockBindService, mockContainer, mockService, mockUnbindService, query, queryOptional, unapplySeeds, useCommandCaller, useCommandHandler, useContainer, useEvent, useEventEmitter, useEvents, useEventsHandler, useInjection, useOptionalCommandCaller, useOptionalInjection, useOptionalQueryCaller, useOptionalSyncQueryCaller, useQueryCaller, useQueryHandler, useRootContainer, useScope, useSyncQueryCaller, withContainerProvider };
//# sourceMappingURL=wirestate-react-signals.js.map
