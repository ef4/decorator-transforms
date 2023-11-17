import { transform, TransformOptions } from "@babel/core";
// @ts-expect-error no upstream types
import legacyDecorators from "@babel/plugin-proposal-decorators";
// @ts-expect-error no upstream types
import classProperties from "@babel/plugin-transform-class-properties";

import ourDecorators from "../src/index.ts";

function builder(plugins: TransformOptions["plugins"]) {
  return function build(src: string, scope: Record<string, any>) {
    let fn = eval(
      transform(
        `
     (function(${Object.keys(scope).join(",")}) { 
      return (${src})
     })
    `,
        { plugins }
      )!.code!
    );
    return fn(...Object.values(scope));
  };
}

export type Builder = (src: string, scope: Record<string, any>) => any;

export const oldBuild = builder([
  [legacyDecorators, { legacy: true }],
  classProperties,
]);

export const newBuild = builder([ourDecorators]);

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
