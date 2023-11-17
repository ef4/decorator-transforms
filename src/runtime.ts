export interface Descriptor {
  configurable?: boolean;
  enumerable?: boolean;
  writable?: boolean;
  get?(): any;
  set?(v: any): void;
  initializer?: () => any;
}
export type LegacyDecorator = (
  target: object,
  prop: string,
  desc: Descriptor
) => Descriptor | null;

export function applyDecorator(
  target: { prototype: object },
  prop: string,
  decorators: LegacyDecorator[],
  initializer?: () => any
) {
  let desc: Descriptor = {
    configurable: true,
    enumerable: true,
    writable: true,
  };
  if (initializer) {
    desc.initializer = initializer;
  }
  for (let decorator of decorators) {
    let updatedDesc = decorator(target.prototype, prop, desc);
    if (!updatedDesc) {
      throw new Error("unimplemented: side-effectful decorator");
    }
    desc = updatedDesc;
  }
  Object.defineProperty(target.prototype, prop, desc);
}
