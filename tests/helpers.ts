import { transform, TransformOptions } from "@babel/core";
// @ts-expect-error no upstream types
import legacyDecorators from "@babel/plugin-proposal-decorators";
// @ts-expect-error no upstream types
import classProperties from "@babel/plugin-transform-class-properties";
// @ts-expect-error no upstream types
import classPrivateMethods from "@babel/plugin-transform-private-methods";

import * as vm from "node:vm";
import ourDecorators, { Options } from "../src/index.ts";

try {
  new vm.SourceTextModule(`export {}`);
} catch (err) {
  throw new Error(
    `this test suite require the node flag "--experimental-vm-modules" in order to evaluate dynamically transpiled ES modules`
  );
}

function builder(
  exprPlugins: TransformOptions["plugins"],
  modulePlugins?: TransformOptions["plugins"]
): Builder {
  function expression(src: string, scope: Record<string, any>) {
    let transformedSrc = transform(
      `
   (function(${Object.keys(scope).join(",")}) { 
    return (${src})
   })
  `,
      { plugins: exprPlugins }
    )!.code!;
    let fn = eval(transformedSrc);
    return fn(...Object.values(scope));
  }

  async function module(src: string, deps: Record<string, any>) {
    let transformedSrc = transform(src, {
      plugins: modulePlugins ?? exprPlugins,
    })!.code!;
    let context = vm.createContext({ deps });
    let m: vm.SourceTextModule;
    try {
      m = new vm.SourceTextModule(transformedSrc, { context });
    } catch (err) {
      throw new Error(`unable to compile module:\n${transformedSrc}`);
    }
    await m.link(async function linker(specifier) {
      let dep = deps[specifier];
      if (!dep) {
        throw new Error(`unresolved dep ${specifier}`);
      }
      let depSrc = Object.keys(dep)
        .map((name) =>
          name === "default"
            ? `export default deps["${specifier}"]["${name}"]`
            : `export const ${name} = deps["${specifier}"]["${name}"]`
        )
        .join("\n");
      return new vm.SourceTextModule(depSrc, { context });
    });

    await m.evaluate();
    return m.namespace;
  }

  return { expression, module };
}

export interface Builder {
  expression: (src: string, scope: Record<string, any>) => any;
  module: (src: string, deps: Record<string, any>) => Promise<any>;
}

export const oldBuild: Builder = builder([
  [legacyDecorators, { legacy: true }],
  classProperties,
  classPrivateMethods,
]);

let globalOpts: Options = { runtime: "globals" };
let importOpts: Options = {
  runtime: { import: "decorator-transforms/runtime" },
};

export const newBuild: Builder = builder(
  [[ourDecorators, globalOpts]],
  [[ourDecorators, importOpts]]
);
