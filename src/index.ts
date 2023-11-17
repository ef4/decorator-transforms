import type * as Babel from "@babel/core";
import type { types as t, NodePath } from "@babel/core";
// @ts-expect-error no upstream types
import decoratorSyntax from "@babel/plugin-syntax-decorators";

export default function legacyDecoratorCompat(
  babel: typeof Babel
): Babel.PluginObj {
  const t = babel.types;
  return {
    inherits: (api: unknown, _options: unknown, dirname: unknown) =>
      decoratorSyntax(api, { legacy: true }, dirname),
    visitor: {
      ClassProperty(path: NodePath<t.ClassProperty>) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | null;
        if (decorators) {
          let args: t.Expression[] = [
            t.identifier("this"),
            t.stringLiteral(propName(path.node.key)),
            t.arrayExpression(decorators.map((d) => d.node.expression)),
          ];
          if (path.node.value) {
            args.push(
              t.functionExpression(
                null,
                [],
                t.blockStatement([t.returnStatement(path.node.value)])
              )
            );
          }
          path.insertBefore(
            t.staticBlock([
              t.expressionStatement(
                t.callExpression(t.identifier("applyDecorator"), args)
              ),
            ])
          );
          path.remove();
        }
      },
    },
  };
}

function propName(expr: t.Expression): string {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  throw new Error(`unexpected decorator property name ${expr.type}`);
}
