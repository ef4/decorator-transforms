export interface Descriptor {
  configurable?: boolean;
  enumerable?: boolean;
  writable?: boolean;
  get?(): any;
  set?(v: any): void;
  initializer?: null | (() => any);
  value?: any;
}
export type LegacyDecorator = (
  target: object,
  prop: unknown,
  desc: Descriptor
) => Descriptor | null | undefined | void;

export type LegacyClassDecorator = (target: new (...args: any) => any) =>
  | {
      new (...args: any): any;
    }
  | null
  | undefined
  | void;

const deferred: WeakMap<
  object,
  Map<string | number | symbol, Descriptor>
> = new WeakMap();

function deferDecorator(
  proto: object,
  prop: string | number | symbol,
  desc: Descriptor
): void {
  let map = deferred.get(proto);
  if (!map) {
    map = new Map();
    deferred.set(proto, map);
  }
  map.set(prop, desc);
}

function findDeferredDecorator(
  target: object,
  prop: string | number | symbol
): Descriptor | undefined {
  let cursor: object = (target as any).prototype;
  while (cursor) {
    let desc = deferred.get(cursor)?.get(prop);
    if (desc) {
      return desc;
    }
    cursor = (cursor as any).prototype;
  }
}

function decorateFieldV1(
  target: { prototype: object },
  prop: string | number | symbol,
  decorators: LegacyDecorator[],
  initializer?: () => any
): void {
  return decorateFieldV2(target.prototype, prop, decorators, initializer);
}

function decorateFieldV2(
  prototype: object,
  prop: string | number | symbol,
  decorators: LegacyDecorator[],
  initializer?: () => any
): void {
  let desc: Descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null,
  };
  if (initializer) {
    desc.initializer = initializer;
  }
  for (let decorator of decorators) {
    desc = decorator(prototype, prop, desc) || desc;
  }
  if (desc.initializer === undefined) {
    Object.defineProperty(prototype, prop, desc);
  } else {
    deferDecorator(prototype, prop, desc);
  }
}

function decorateMethodV1(
  { prototype }: { prototype: object },
  prop: string | number | symbol,
  decorators: LegacyDecorator[]
): void {
  return decorateMethodV2(prototype, prop, decorators);
}

function decorateMethodV2(
  prototype: object,
  prop: string | number | symbol,
  decorators: LegacyDecorator[]
): void {
  const origDesc = Object.getOwnPropertyDescriptor(prototype, prop);
  let desc: Descriptor = { ...origDesc };
  for (let decorator of decorators) {
    desc = decorator(prototype, prop, desc) || desc;
  }
  if (desc.initializer !== undefined) {
    desc.value = desc.initializer ? desc.initializer.call(prototype) : void 0;
    desc.initializer = undefined;
  }
  Object.defineProperty(prototype, prop, desc);
}

function initializeDeferredDecorator(
  target: object,
  prop: string | number | symbol
): void {
  let desc = findDeferredDecorator(target.constructor, prop);
  if (desc) {
    Object.defineProperty(target, prop, {
      enumerable: desc.enumerable,
      configurable: desc.configurable,
      writable: desc.writable,
      value: desc.initializer ? desc.initializer.call(target) : undefined,
    });
  }
}

function decorateClass(
  target: new (...args: any) => any,
  decorators: LegacyClassDecorator[]
): new (...args: any) => any {
  return decorators.reduce(
    (accum, decorator) => decorator(accum) || accum,
    target
  );
}

function decoratePOJO(
  pojo: object,
  decorated: ["field" | "method", string | number | symbol, LegacyDecorator[]][]
) {
  for (let [type, prop, decorators] of decorated) {
    if (type === "field") {
      decoratePojoField(pojo, prop, decorators);
    } else {
      decorateMethodV2(pojo, prop, decorators);
    }
  }
  return pojo;
}
function decoratePojoField(
  pojo: object,
  prop: string | number | symbol,
  decorators: LegacyDecorator[]
) {
  let desc: Descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: () => Object.getOwnPropertyDescriptor(pojo, prop)?.value,
  };
  for (let decorator of decorators) {
    desc = decorator(pojo, prop, desc) || desc;
  }
  if (desc.initializer) {
    desc.value = desc.initializer.call(pojo);
    delete desc.initializer;
  }
  Object.defineProperty(pojo, prop, desc);
}

export {
  decorateFieldV1 as f,
  decorateFieldV2 as g,
  decorateMethodV1 as m,
  decorateMethodV2 as n,
  initializeDeferredDecorator as i,
  decorateClass as c,
  decoratePOJO as p,
};
