import type * as Babel from "@babel/core";
import type { types as t, NodePath } from "@babel/core";
// @ts-expect-error no upstream types
import decoratorSyntax from "@babel/plugin-syntax-decorators";

export default function legacyDecoratorCompat(
  babel: typeof Babel
): Babel.PluginObj {
  return {
    inherits: (api: unknown, _options: unknown, dirname: unknown) =>
      decoratorSyntax(api, { legacy: true }, dirname),
    visitor: {
      ClassProperty(path: NodePath<t.ClassProperty>) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | null;
        if (decorators) {
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      },
    },
  };
}
