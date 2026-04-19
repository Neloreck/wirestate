'use no memo';
import {LazyServiceIdentifier,bindingTypeValues,Container}from'inversify';export{bindingTypeValues as BindingType,Container,inject as Inject,injectable as Injectable,bindingScopeValues as ScopeBindingType}from'inversify';import {observable,action,computed}from'mobx';export{autorun,flow,flowResult,isFlow,isFlowCancellationError,makeAutoObservable,makeObservable,runInAction}from'mobx';export{observer}from'mobx-react-lite';import {createContext,useContext,useState,useMemo,useEffect,createElement,useCallback,useRef}from'react';import {jsx}from'react/jsx-runtime';function Observable() {
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
}function bindConstant(container, token, value, options = {}) {
  if (options.isWithBindingCheck && container.isBound(token)) {
    return;
  }
  container.bind(token).toConstantValue(value);
}const SIGNAL_BUS_TOKEN = Symbol.for("@wirestate/signal-bus");
const QUERY_BUS_TOKEN = Symbol.for("@wirestate/query-bus");
const INITIAL_STATE_TOKEN = Symbol.for("@wirestate/initial-state");
const INITIAL_STATE_SHARED_TOKEN = Symbol.for("@wirestate/initial-state/shared");
const QUERY_HANDLER_METADATA = new WeakMap();
const SIGNAL_HANDLER_METADATA = new WeakMap();
const CONTAINER_REFS_BY_SERVICE = new WeakMap();
const SIGNAL_UNSUBSCRIBERS_BY_SERVICE = new WeakMap();
const QUERY_UNREGISTERS_BY_SERVICE = new WeakMap();function getQueryHandlerMetadata(instance) {
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
}function getSignalHandlerMetadata(instance) {
  let constructor = instance.constructor;
  const chain = [];
  while (typeof constructor === "function" && constructor !== Object && constructor !== Function.prototype) {
    const own = SIGNAL_HANDLER_METADATA.get(constructor);
    if (own && own.length > 0) {
      chain.push(own);
    }
    constructor = Object.getPrototypeOf(constructor);
  }
  return chain.reverse().flat();
}function buildSignalDispatcher(instance) {
  const entries = [];
  if (typeof instance.onSignal === "function") {
    entries.push({
      types: null,
      handler: signal => instance.onSignal?.(signal)
    });
  }
  for (const meta of getSignalHandlerMetadata(instance)) {
    const method = instance[meta.methodName];
    if (typeof method === "function") {
      entries.push({
        types: meta.types,
        handler: method.bind(instance)
      });
    }
  }
  if (entries.length) {
    return signal => {
      for (const entry of entries) {
        if (entry.types === null || entry.types.includes(signal.type)) {
          entry.handler(signal);
        }
      }
    };
  } else {
    return null;
  }
}function bindService(container, token, ServiceClass, options) {
  if (options?.isWithBindingCheck && container.isBound(token)) {
    return;
  }
  const whenBind = container.bind(token).to(ServiceClass).inSingletonScope();
  if (options?.isWithIgnoreLifecycle) {
    return;
  }
  whenBind.onActivation((ctx, instance) => {
    CONTAINER_REFS_BY_SERVICE.set(instance, container);
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
    const result = instance.onActivated();
    if (result && typeof result.then === "function") {
      result.catch(error => {
        console.error("[wirestate] onActivated rejected for:", ServiceClass.name, error);
      });
    }
    return instance;
  });
  whenBind.onDeactivation(instance => {
    instance.IS_DISPOSED = true;
    _detachQueryUnregs(instance);
    _detachSignalSub(instance);
    CONTAINER_REFS_BY_SERVICE.delete(instance);
    return instance.onDeactivated();
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
}function bindEntry(container, entry, isWithBindingCheck) {
  if (typeof entry === "function") {
    bindService(container, entry, entry, {
      isWithBindingCheck
    });
    return;
  }
  if (!entry.type || entry.type === bindingTypeValues.ConstantValue) {
    bindConstant(container, entry.id, entry.value, {
      isWithBindingCheck
    });
    return;
  }
  bindService(container, entry.id, entry.value, {
    isWithBindingCheck
  });
}class InitialState {
  constructor(shared = {}, bound = []) {
    this.sharedState = shared;
    this.boundStates = new Map();
    for (const [ServiceClass, state] of bound) {
      this.boundStates.set(ServiceClass, state);
    }
  }
  getShared() {
    return this.sharedState;
  }
  getFor(ServiceClass) {
    return this.boundStates.get(ServiceClass) || null;
  }
  hasFor(ServiceClass) {
    return this.boundStates.has(ServiceClass);
  }
}const ERROR_CODE_GENERIC = 1;
const ERROR_CODE_VALIDATION_ERROR = 50;
const ERROR_CODE_INVALID_ARGUMENTS = 51;
const ERROR_CODE_INVALID_CONTEXT = 52;
const ERROR_CODE_FAILED_TO_RESOLVE = 100;
const ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER = 101;
const ERROR_CODE_ACCESS_BEFORE_ACTIVATION = 200;class WirestateError extends Error {
  name = "WirestateError";
  constructor(code = ERROR_CODE_GENERIC, detail) {
    super();
    this.code = code;
    this.message = detail || "Wirestate error.";
  }
}class QueryBus {
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
    throw new WirestateError(ERROR_CODE_FAILED_TO_RESOLVE_QUERY_HANDLER, `No query handler registered in container for type: '${String(type)}'.`);
  }
  has(type) {
    const stack = this.handlers.get(type);
    return Boolean(stack && stack.length);
  }
  clear() {
    this.handlers.clear();
  }
}class SignalBus {
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
}function createIocContainer(options = {}) {
  const container = new Container({
    defaultScope: "Singleton",
    parent: options.parent
  });
  const initialState = new InitialState();
  container.bind(SIGNAL_BUS_TOKEN).toConstantValue(new SignalBus());
  container.bind(QUERY_BUS_TOKEN).toConstantValue(new QueryBus());
  container.bind(INITIAL_STATE_TOKEN).toConstantValue(new InitialState());
  container.bind(INITIAL_STATE_SHARED_TOKEN).toConstantValue(initialState.getShared());
  return container;
}function emitSignal(container, signal) {
  container.get(SIGNAL_BUS_TOKEN).emit(signal);
}function query(container, type, data) {
  return container.get(QUERY_BUS_TOKEN).query(type, data);
}function applyInitialState(container, shared = {}, bound = []) {
  const nextInitialState = new InitialState(shared, bound);
  if (container.isBound(INITIAL_STATE_TOKEN)) {
    container.rebind(INITIAL_STATE_TOKEN).toConstantValue(nextInitialState);
    container.rebind(INITIAL_STATE_SHARED_TOKEN).toConstantValue(nextInitialState.getShared());
  } else {
    container.bind(INITIAL_STATE_TOKEN).toConstantValue(nextInitialState);
    container.bind(INITIAL_STATE_SHARED_TOKEN).toConstantValue(nextInitialState.getShared());
  }
}function getEntryToken(entry) {
  return typeof entry === "function" ? entry : entry.id;
}const IocContext = createContext(null);
IocContext.displayName = "IocContext";function createServicesProvider(entries, options = {}) {
  const {
    activate
  } = options;
  if (activate && activate.length > 0) {
    const entryTokens = entries.map(getEntryToken);
    for (const eager of activate) {
      if (!entryTokens.includes(eager)) {
        throw new WirestateError(ERROR_CODE_VALIDATION_ERROR, `createServicesProvider: '${String(eager)}' is listed in 'activate' but was not provided in 'entries'.`);
      }
    }
  }
  function ServicesProviderComponent(props) {
    const iocContext = useContext(IocContext);
    if (!iocContext) {
      throw new WirestateError(ERROR_CODE_INVALID_CONTEXT, "<ServicesProvider> must be rendered inside an <IocProvider> React subtree.");
    }
    const [initialPropsSnapshot] = useState(() => props);
    useMemo(() => {
      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);
      for (const entry of entries) {
        bindEntry(iocContext.container, entry, true);
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
    }, entries);
    useEffect(() => {
      let didRebind = false;
      applyInitialState(iocContext.container, initialPropsSnapshot.initialState, initialPropsSnapshot.initialStates);
      for (const entry of entries) {
        const token = getEntryToken(entry);
        if (!iocContext.container.isBound(token)) {
          didRebind = true;
        }
        bindEntry(iocContext.container, entry, true);
      }
      if (activate) {
        for (const eager of activate) {
          iocContext.container.get(eager);
        }
      }
      if (didRebind) {
        iocContext.setRevision(r => r + 1);
      }
      return () => {
        for (const entry of entries) {
          const token = getEntryToken(entry);
          if (iocContext.container.isBound(token)) {
            iocContext.container.unbind(token);
          }
        }
        applyInitialState(iocContext.container, {}, []);
      };
    }, entries);
    return props.children;
  }
  ServicesProviderComponent.displayName = "ServicesProvider";
  return ServicesProviderComponent;
}const IocProvider = ({
  container: externalContainer,
  children
}) => {
  const [revision, setRevision] = useState(0);
  const [ownedContainer] = useState(() => externalContainer ? null : createIocContainer());
  const container = externalContainer ?? ownedContainer;
  if (!container) {
    throw new WirestateError(ERROR_CODE_FAILED_TO_RESOLVE, "[ioc] IocProvider failed to resolve a container instance.");
  }
  const value = useMemo(() => ({
    container,
    revision,
    setRevision
  }), [container, revision]);
  return createElement(IocContext.Provider, {
    value
  }, children);
};function useIocContext() {
  const value = useContext(IocContext);
  if (!value) {
    throw new WirestateError(ERROR_CODE_INVALID_CONTEXT, "Trying to access IOC context from React subtree not wrapped in <IocProvider>.");
  }
  return value;
}function useContainer() {
  return useIocContext().container;
}function useContainerRevision() {
  return useIocContext().revision;
}function OnQuery(type) {
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
}function useQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QUERY_BUS_TOKEN).query(type, data);
  }, [container]);
}function useQueryHandler(type, handler) {
  const container = useContainer();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });
  useEffect(() => {
    const bus = container.get(QUERY_BUS_TOKEN);
    return bus.register(type, data => handlerRef.current(data));
  }, [container, type]);
}function useSyncQueryCaller() {
  const container = useContainer();
  return useCallback((type, data) => {
    return container.get(QUERY_BUS_TOKEN).query(type, data);
  }, [container]);
}class AbstractService {
  IS_DISPOSED = false;
  getContainer() {
    const ref = CONTAINER_REFS_BY_SERVICE.get(this);
    if (ref) {
      return ref;
    } else {
      throw new WirestateError(ERROR_CODE_ACCESS_BEFORE_ACTIVATION, "AbstractService::container accessed before activation. " + "Ensure service is bound to container and is properly resolved.");
    }
  }
  getService(serviceId) {
    return this.getContainer().get(serviceId);
  }
  emitSignal(signal) {
    this.getContainer().get(SIGNAL_BUS_TOKEN).emit(signal);
  }
  queryData(type, data) {
    return this.getContainer().get(QUERY_BUS_TOKEN).query(type, data);
  }
  getInitialState(ServiceClass) {
    const initialState = this.getContainer().get(INITIAL_STATE_TOKEN);
    return (ServiceClass ? initialState.getFor(ServiceClass) : initialState.getShared()) || null;
  }
  onActivated() {}
  onDeactivated() {}
}function useService(token) {
  const {
    container,
    revision
  } = useIocContext();
  return useMemo(() => {
    return container.get(token);
  }, [container, revision, token]);
}function OnSignal(types) {
  const normalized = types === undefined ? null : Array.isArray(types) ? [...types] : [types];
  return (target, propertyKey) => {
    const constructor = target.constructor;
    let list = SIGNAL_HANDLER_METADATA.get(constructor);
    if (!list) {
      list = [];
      SIGNAL_HANDLER_METADATA.set(constructor, list);
    }
    list.push({
      methodName: propertyKey,
      types: normalized
    });
  };
}function useSignal(typeOrHandler, maybeHandler) {
  const container = useContainer();
  const isFilter = typeof typeOrHandler === "string" || typeof typeOrHandler === "symbol" || Array.isArray(typeOrHandler);
  const activeHandler = isFilter ? maybeHandler : typeOrHandler;
  const handlerRef = useRef(activeHandler);
  const types = useMemo(() => {
    if (!isFilter) {
      return null;
    }
    return Array.isArray(typeOrHandler) ? typeOrHandler : [typeOrHandler];
  }, [typeOrHandler, isFilter]);
  useEffect(() => {
    handlerRef.current = activeHandler;
  });
  useEffect(() => {
    const bus = container.get(SIGNAL_BUS_TOKEN);
    return bus.subscribe(signal => {
      if (types !== null && !types.includes(signal.type)) {
        return;
      }
      handlerRef.current?.(signal);
    });
  }, [container, types]);
}function useSignalEmitter() {
  const container = useIocContext().container;
  return useCallback(signal => {
    container.get(SIGNAL_BUS_TOKEN).emit(signal);
  }, [container]);
}function mockBindService(container, ServiceClass, options = {}) {
  const {
    token,
    skipLifecycle
  } = options;
  return token ? bindService(container, token, ServiceClass, {
    isWithBindingCheck: false,
    isWithIgnoreLifecycle: skipLifecycle
  }) : bindService(container, ServiceClass, ServiceClass, {
    isWithBindingCheck: false,
    isWithIgnoreLifecycle: skipLifecycle
  });
}function mockContainer(options = {}) {
  const container = createIocContainer();
  const {
    activate = [],
    services = []
  } = options;
  if (activate.length) {
    for (const token of options.activate ?? []) {
      if (!services.includes(token)) {
        throw new WirestateError(ERROR_CODE_INVALID_ARGUMENTS, "Provided services for activation not matching list of services to bind.");
      }
    }
  }
  for (const service of options.services ?? []) {
    mockBindService(container, service, {
      skipLifecycle: options.skipLifecycle,
      token: service
    });
  }
  for (const token of options.activate ?? []) {
    container.get(token);
  }
  return container;
}function mockService(service, container = mockContainer(), options = {}) {
  mockBindService(container, service, {
    skipLifecycle: options.skipLifecycle,
    token: options.token
  });
  return container.get(service);
}function withIocProvider(children, container = mockContainer()) {
  return jsx(IocProvider, {
    container: container,
    children: children
  });
}export{AbstractService,Action,Computed,DeepObservable,INITIAL_STATE_SHARED_TOKEN as INITIAL_STATE,InitialState,IocProvider,Observable,OnQuery,OnSignal,RefObservable,ShallowObservable,applyInitialState,bindConstant,bindEntry,bindService,createIocContainer,createServicesProvider,emitSignal,forwardRef,mockBindService,mockContainer,mockService,query,useContainer,useContainerRevision,useQueryCaller,useQueryHandler,useService,useSignal,useSignalEmitter,useSyncQueryCaller,withIocProvider};