import type * as Babel from "@babel/core";
import type { types as t, NodePath } from "@babel/core";
import { ImportUtil } from "babel-import-util";
import { globalId } from "./global-id.ts";

// @ts-expect-error no upstream types
import PluginSyntaxDecorators from "@babel/plugin-syntax-decorators";
const decoratorSyntax =
  PluginSyntaxDecorators.default || PluginSyntaxDecorators;

interface State extends Babel.PluginPass {
  currentClassBodies: t.ClassBody[];
  currentObjectExpressions: {
    decorated: [
      "field" | "method",
      t.Expression, // for the property name
      t.Expression[] // for the decorators applied to it
    ][];
  }[];
  opts: Options;
  runtime: (target: NodePath<t.Node>, fnName: string) => t.Expression;
  optsWithDefaults: Required<Options>;
}

export interface Options {
  runtime?: "globals" | { import: string };
  staticBlock?: "native" | "field";
}

export default function legacyDecoratorCompat(
  babel: typeof Babel
): Babel.PluginObj<State> {
  const t = babel.types;
  return {
    inherits: (api: unknown, _options: unknown, dirname: unknown) =>
      decoratorSyntax(api, { legacy: true }, dirname),
    visitor: {
      Program(path: NodePath<t.Program>, state: State) {
        state.currentClassBodies = [];
        state.currentObjectExpressions = [];
        state.optsWithDefaults = {
          runtime: "globals",
          staticBlock: "native",
          ...state.opts,
        };
        let importUtil = new ImportUtil(t, path);
        state.runtime = (target: NodePath<t.Node>, fnName: string) => {
          const { runtime } = state.optsWithDefaults;
          if (runtime === "globals") {
            return t.memberExpression(
              t.identifier(globalId),
              t.identifier(fnName)
            );
          } else {
            return importUtil.import(target, runtime.import, fnName);
          }
        };
      },
      ClassBody: {
        enter(path, state) {
          state.currentClassBodies.unshift(path.node);
        },
        exit(_path, state) {
          state.currentClassBodies.shift();
        },
      },
      ClassExpression(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          let call = t.expressionStatement(
            t.callExpression(state.runtime(path, "c"), [
              path.node,
              t.arrayExpression(
                decorators
                  .slice()
                  .reverse()
                  .map((d) => d.node.expression)
              ),
            ])
          );
          for (let decorator of decorators) {
            decorator.remove();
          }
          path.replaceWith(call);
        }
      },
      ClassDeclaration(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          let call = t.callExpression(state.runtime(path, "c"), [
            t.classExpression(
              path.node.id,
              path.node.superClass,
              path.node.body,
              [] // decorators removed here
            ),
            t.arrayExpression(
              decorators
                .slice()
                .reverse()
                .map((d) => d.node.expression)
            ),
          ]);

          if (path.parentPath.isExportDefaultDeclaration()) {
            let id = path.node.id;
            if (id) {
              path.parentPath.insertBefore(
                t.variableDeclaration("const", [t.variableDeclarator(id, call)])
              );
              path.parentPath.replaceWith(t.exportDefaultDeclaration(id));
            } else {
              path.parentPath.replaceWith(t.exportDefaultDeclaration(call));
            }
          } else if (path.parentPath.isExportNamedDeclaration()) {
            let id = path.node.id;
            if (!id) {
              throw new Error(
                `bug: expected a class name is required in this context`
              );
            }
            path.parentPath.insertBefore(
              t.variableDeclaration("const", [t.variableDeclarator(id, call)])
            );
            path.parentPath.replaceWith(
              t.exportNamedDeclaration(null, [t.exportSpecifier(id, id)])
            );
          } else {
            let id = path.node.id;
            if (!id) {
              throw new Error(
                `bug: expected a class name is required in this context`
              );
            }
            path.replaceWith(
              t.variableDeclaration("const", [t.variableDeclarator(id, call)])
            );
          }
        }
      },
      ClassProperty(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          let prototype: t.Expression;
          if (path.node.static) {
            prototype = t.identifier("this");
          } else {
            prototype = t.memberExpression(
              t.identifier("this"),
              t.identifier("prototype")
            );
          }
          let args: t.Expression[] = [
            prototype,
            valueForFieldKey(t, path.node.key),
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
            compatStaticBlock(
              state,
              t,
              path.node.key,
              t.callExpression(state.runtime(path, "g"), args)
            )
          );
          path.insertBefore(
            t.classPrivateProperty(
              t.privateName(
                t.identifier(
                  unusedPrivateNameLike(state, propName(path.node.key))
                )
              ),
              t.sequenceExpression([
                t.callExpression(state.runtime(path, "i"), [
                  t.identifier("this"),
                  valueForFieldKey(t, path.node.key),
                ]),
                t.identifier("void 0"),
              ])
            )
          );
          path.remove();
        }
      },
      ClassMethod(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          let prototype: t.Expression;
          if (path.node.static) {
            prototype = t.identifier("this");
          } else {
            prototype = t.memberExpression(
              t.identifier("this"),
              t.identifier("prototype")
            );
          }
          path.insertAfter(
            compatStaticBlock(
              state,
              t,
              path.node.key,
              t.callExpression(state.runtime(path, "n"), [
                prototype,
                valueForFieldKey(t, path.node.key),
                t.arrayExpression(
                  decorators
                    .slice()
                    .reverse()
                    .map((d) => d.node.expression)
                ),
              ])
            )
          );
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      },
      ObjectExpression: {
        enter(_path, state) {
          state.currentObjectExpressions.unshift({
            decorated: [],
          });
        },
        exit(path, state) {
          let { decorated } = state.currentObjectExpressions.shift()!;
          if (decorated.length > 0) {
            path.replaceWith(
              t.callExpression(state.runtime(path, "p"), [
                path.node,
                t.arrayExpression(
                  decorated.map(([type, prop, decorators]) =>
                    t.arrayExpression([
                      t.stringLiteral(type),
                      prop,
                      t.arrayExpression(decorators),
                    ])
                  )
                ),
              ])
            );
          }
        },
      },
      ObjectProperty(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          if (state.currentObjectExpressions.length === 0) {
            throw new Error(
              `bug in decorator-transforms: didn't expect to see ObjectProperty outside ObjectExpression`
            );
          }
          let prop = path.node.key;
          if (prop.type === "PrivateName") {
            throw new Error(`cannot decorate private field`);
          }
          state.currentObjectExpressions[0].decorated.push([
            "field",
            valueForFieldKey(t, prop),
            decorators
              .slice()
              .reverse()
              .map((d) => d.node.expression),
          ]);
          for (let decorator of decorators) {
            decorator.remove();
          }
        }
      },

      ObjectMethod(path, state) {
        let decorators = path.get("decorators") as
          | NodePath<t.Decorator>[]
          | NodePath<undefined>;
        if (Array.isArray(decorators) && decorators.length > 0) {
          if (state.currentObjectExpressions.length === 0) {
            throw new Error(
              `bug in decorator-transforms: didn't expect to see ObjectMethod outside ObjectExpression`
            );
          }
          let prop = path.node.key;
          state.currentObjectExpressions[0].decorated.push([
            "method",
            valueForFieldKey(t, prop),
            decorators
              .slice()
              .reverse()
              .map((d) => d.node.expression),
          ]);
          for (let decorator of decorators) {
            decorator.remove();
          }
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
  while (usedNames.has(candidate)) {
    candidate = candidate + "_";
  }
  return candidate;
}

// derive a best-effort name we can use when creating a private-field
function propName(expr: t.Expression): string {
  if (expr.type === "Identifier") {
    return expr.name;
  }
  if (expr.type === "BigIntLiteral" || expr.type === "NumericLiteral") {
    return `_${expr.value}`;
  }
  if (expr.type === "StringLiteral") {
    return "_" + expr.value.replace(/[^a-zA-Z]/g, "");
  }
  return "_";
}

// turn the field key into a runtime value. Identifiers are special because they
// need to become string literals, anything else is already usable as a value.
function valueForFieldKey(
  t: (typeof Babel)["types"],
  expr: t.Expression
): t.Expression {
  if (expr.type === "Identifier") {
    return t.stringLiteral(expr.name);
  }
  return expr;
}

// create a static block or a private class field depending on the staticBlock option
function compatStaticBlock(
  state: State,
  t: (typeof Babel)["types"],
  key: t.Expression,
  expression: t.Expression
) {
  if (state.optsWithDefaults.staticBlock === "native") {
    return t.staticBlock([t.expressionStatement(expression)]);
  } else {
    return t.classPrivateProperty(
      t.privateName(t.identifier(unusedPrivateNameLike(state, propName(key)))),
      expression,
      null,
      true
    );
  }
}
