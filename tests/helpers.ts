import { transform, TransformOptions, parseSync, traverse } from "@babel/core";

// @ts-expect-error no upstream types
import legacyDecorators from "@babel/plugin-proposal-decorators";
// @ts-expect-error no upstream types
import classProperties from "@babel/plugin-transform-class-properties";
// @ts-expect-error no upstream types
import classPrivateMethods from "@babel/plugin-transform-private-methods";
// @ts-expect-error no upstream types
import presetEnv from "@babel/preset-env";

import * as vm from "node:vm";
import ourDecorators, { Options } from "../src/index.ts";

try {
  new vm.SourceTextModule(`export {}`);
} catch (err) {
  throw new Error(
    `this test suite require the node flag "--experimental-vm-modules" in order to evaluate dynamically transpiled ES modules`
  );
}

export function builder(
  exprPlugins: TransformOptions["plugins"],
  modulePlugins?: TransformOptions["plugins"],
  presets?: TransformOptions["presets"],
  filename = "example.js"
): Builder {
  function transformSrc(src: string) {
    return transform(src, { plugins: exprPlugins, presets })!.code!;
  }

  function expression(src: string, scope: Record<string, any>) {
    let transformedSrc = transformSrc(`
    (function(${Object.keys(scope).join(",")}) { 
     return (${src})
    })
   `);
    let fn = eval(transformedSrc);
    return fn(...Object.values(scope));
  }

  async function module(src: string, deps: Record<string, any>) {
    let transformedSrc = transform(src, {
      plugins: modulePlugins ?? exprPlugins,
      presets,
      filename,
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

  return { expression, module, transformSrc };
}

export interface Builder {
  transformSrc: (src: string) => string;
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

export const compatNewBuild: Builder = (() => {
  const targets = "Safari 12";

  function transformSrc(src: string) {
    return transform(src, {
      plugins: [[ourDecorators, { runtime: "globals", runEarly: true }]],
      presets: [[presetEnv, { targets }]],
    })!.code!;
  }

  function expression(src: string, scope: Record<string, any>) {
    let transformedSrc = transformSrc(`
    (function(${Object.keys(scope).join(",")}) { 
     return (${src})
    })
   `);
    let fn = eval(transformedSrc);
    return fn(...Object.values(scope));
  }

  async function module(src: string, deps: Record<string, any>) {
    let transformedSrc = transform(src, {
      plugins: [
        [
          ourDecorators,
          {
            runtime: { import: "decorator-transforms/runtime" },
            runEarly: true,
          },
        ],
      ],
      presets: [[presetEnv, { targets }]],
    })!.code!;

    let exports = {};

    function require(specifier: string) {
      let result = deps[specifier];
      if (!result) {
        throw new Error(`unresolved dep ${specifier}`);
      }
      Object.defineProperty(result, "__esModule", { value: true });
      return result;
    }

    let context = vm.createContext({ require, exports });
    let m: vm.Script;
    try {
      m = new vm.Script(transformedSrc);
    } catch (err) {
      throw new Error(`unable to compile module:\n${transformedSrc}`);
    }
    await m.runInContext(context);
    return exports;
  }

  return {
    transformSrc,
    expression,
    module,
  };
})();

export function featureAssertions(hooks: NestedHooks) {
  hooks.beforeEach((assert) => {
    assert.usesFeature = usesFeature;
    assert.doesNotUseFeature = doesNotUseFeature;
  });
}

function usesFeature(
  this: Assert,
  srcCode: string,
  feature: "staticBlocks" | "privateNames"
) {
  let result = uses(srcCode)[feature];
  this.pushResult({
    result,
    actual: srcCode,
    expected: `no ${feature}`,
    message: `expected src to use ${feature}`,
  });
}

function doesNotUseFeature(
  this: Assert,
  srcCode: string,
  feature: "staticBlocks" | "privateNames"
) {
  let result = !uses(srcCode)[feature];
  this.pushResult({
    result,
    actual: srcCode,
    expected: `some ${feature}`,
    message: `expected src to not use ${feature}`,
  });
}

declare global {
  interface Assert {
    usesFeature: typeof usesFeature;
    doesNotUseFeature: typeof doesNotUseFeature;
  }
}

function uses(src: string): { staticBlocks: boolean; privateNames: boolean } {
  let ast = parseSync(src, { ast: true })!;
  let staticBlocks = false;
  let privateNames = false;
  traverse(ast, {
    StaticBlock() {
      staticBlocks = true;
    },
    PrivateName() {
      privateNames = true;
    },
  });
  return { staticBlocks, privateNames };
}
