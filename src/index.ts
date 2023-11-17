import type * as Babel from "@babel/core";
import type { types as t, NodePath } from "@babel/core";
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { default: decoratorSyntax } = req("@babel/plugin-syntax-decorators");

interface State extends Babel.PluginPass {
  currentClassBodies: t.ClassBody[];
}

export default function legacyDecoratorCompat(
  babel: typeof Babel
): Babel.PluginObj<State> {
  const t = babel.types;
  return {
    inherits: (api: unknown, _options: unknown, dirname: unknown) =>
      decoratorSyntax(api, { legacy: true }, dirname),
    visitor: {
      Program(_path: NodePath<t.Program>, state: State) {
        state.currentClassBodies = [];
      },
      ClassBody: {
        enter(path: NodePath<t.ClassBody>, state: State) {
          state.currentClassBodies.unshift(path.node);
        },
        exit(_path: NodePath<t.ClassBody>, state: State) {
          state.currentClassBodies.pop();
        },
      },
      ClassProperty(path: NodePath<t.ClassProperty>, state: State) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators)) {
          let args: t.Expression[] = [
            t.identifier("this"),
            t.stringLiteral(propName(path.node.key)),
            t.arrayExpression(
              decorators
                .slice()
                .reverse()
                .map((d) => d.node.expression)
            ),
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
          path.insertBefore(
            t.classPrivateProperty(
              t.privateName(
                t.identifier(
                  unusedPrivateNameLike(state, propName(path.node.key))
                )
              ),
              t.sequenceExpression([
                t.callExpression(t.identifier("initDecorator"), [
                  t.identifier("this"),
                  t.stringLiteral(propName(path.node.key)),
                ]),
                t.identifier("void 0"),
              ])
            )
          );
          path.remove();
        }
      },
    },
  };
}

function unusedPrivateNameLike(state: State, name: string): string {
  let classBody = state.currentClassBodies[0];
  if (!classBody) {
    throw new Error(
      `bug: no current class body around our class field decorator`
    );
  }
  let usedNames = new Set();
  for (let element of classBody.body) {
    if (
      (element.type === "ClassPrivateProperty" ||
        element.type === "ClassPrivateMethod" ||
        element.type === "ClassAccessorProperty") &&
      element.key.type === "PrivateName"
    ) {
      usedNames.add(element.key.id.name);
    }
  }
  let candidate = name;
  while (usedNames.has("#" + candidate)) {
    candidate = candidate + "_";
  }
  return candidate;
}

function propName(expr: t.Expression): string {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  throw new Error(`unexpected decorator property name ${expr.type}`);
}
