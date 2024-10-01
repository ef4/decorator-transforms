import type * as Babel from "@babel/core";
import type { types as t, NodePath } from "@babel/core";
import { createRequire } from "node:module";
import { ImportUtil, type Importer } from "babel-import-util";
import { globalId } from "./global-id.ts";
const req = createRequire(import.meta.url);
const { default: decoratorSyntax } = req("@babel/plugin-syntax-decorators");

interface State extends Babel.PluginPass {
  currentClassBodies: t.ClassBody[];
  currentObjectExpressions: {
    node: t.ObjectExpression;
    decorated: [
      "field" | "method",
      t.Expression, // for the property name
      t.Expression[] // for the decorators applied to it
    ][];
  }[];
  opts: Options;
  runtime: (i: Importer, fnName: string) => t.Expression;
  util: ImportUtil;
  optsWithDefaults: Required<Options>;
}

export interface Options {
  runtime?: "globals" | { import: string };
  runEarly?: boolean;
}

function makeVisitor(babel: typeof Babel): Babel.Visitor<State> {
  const t = babel.types;
  return {
    Program(path: NodePath<t.Program>, state: State) {
      state.currentClassBodies = [];
      state.currentObjectExpressions = [];
      state.optsWithDefaults = {
        runtime: "globals",
        runEarly: false,
        ...state.opts,
      };
      state.util = new ImportUtil(babel, path);
      state.runtime = (i: Importer, fnName: string) => {
        const { runtime } = state.optsWithDefaults;
        if (runtime === "globals") {
          return t.memberExpression(
            t.identifier(globalId),
            t.identifier(fnName)
          );
        } else {
          return i.import(runtime.import, fnName);
        }
      };
    },
    ClassBody: {
      enter(path, state) {
        state.currentClassBodies.unshift(path.node);
      },
      exit(path, state) {
        if (state.currentClassBodies[0] === path.node) {
          state.currentClassBodies.shift();
        }
      },
    },
    ClassExpression(path, state) {
      let decorators = path.get("decorators") as
        | NodePath<t.Decorator>[]
        | NodePath<undefined>;
      if (Array.isArray(decorators) && decorators.length > 0) {
        state.util.replaceWith(path, (i) => {
          let call = t.callExpression(state.runtime(i, "c"), [
            path.node,
            t.arrayExpression(
              decorators
                .slice()
                .reverse()
                .map((d) => d.node.expression)
            ),
          ]);
          for (let decorator of decorators) {
            decorator.remove();
          }
          return call;
        });
      }
    },
    ClassDeclaration(path, state) {
      let decorators = path.get("decorators") as
        | NodePath<t.Decorator>[]
        | NodePath<undefined>;
      if (Array.isArray(decorators) && decorators.length > 0) {
        const buildCall = (i: Importer) => {
          return t.callExpression(state.runtime(i, "c"), [
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
        };

        if (path.parentPath.isExportDefaultDeclaration()) {
          let id = path.node.id;
          if (id) {
            state.util.insertBefore(path.parentPath, (i) =>
              t.variableDeclaration("const", [
                t.variableDeclarator(id, buildCall(i)),
              ])
            );
            path.parentPath.replaceWith(t.exportDefaultDeclaration(id));
          } else {
            state.util.replaceWith(path.parentPath, (i) =>
              t.exportDefaultDeclaration(buildCall(i))
            );
          }
        } else if (path.parentPath.isExportNamedDeclaration()) {
          let id = path.node.id;
          if (!id) {
            throw new Error(
              `bug: expected a class name is required in this context`
            );
          }
          state.util.insertBefore(path.parentPath, (i) =>
            t.variableDeclaration("const", [
              t.variableDeclarator(id, buildCall(i)),
            ])
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
          state.util.replaceWith(path, (i) =>
            t.variableDeclaration("const", [
              t.variableDeclarator(id, buildCall(i)),
            ])
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
          prototype = t.thisExpression();
        } else {
          prototype = t.memberExpression(
            t.thisExpression(),
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
        state.util.insertBefore(path, (i) =>
          t.staticBlock([
            t.expressionStatement(
              t.callExpression(state.runtime(i, "g"), args)
            ),
          ])
        );
        state.util.insertBefore(path, (i) =>
          t.classPrivateProperty(
            t.privateName(
              t.identifier(
                unusedPrivateNameLike(state, propName(path.node.key))
              )
            ),
            t.sequenceExpression([
              t.callExpression(state.runtime(i, "i"), [
                t.thisExpression(),
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
          prototype = t.thisExpression();
        } else {
          prototype = t.memberExpression(
            t.thisExpression(),
            t.identifier("prototype")
          );
        }
        state.util.insertAfter(path, (i) =>
          t.staticBlock([
            t.expressionStatement(
              t.callExpression(state.runtime(i, "n"), [
                prototype,
                valueForFieldKey(t, path.node.key),
                t.arrayExpression(
                  decorators
                    .slice()
                    .reverse()
                    .map((d) => d.node.expression)
                ),
              ])
            ),
          ])
        );
        for (let decorator of decorators) {
          decorator.remove();
        }
      }
    },
    ObjectExpression: {
      enter(path, state) {
        state.currentObjectExpressions.unshift({
          node: path.node,
          decorated: [],
        });
      },
      exit(path, state) {
        if (state.currentObjectExpressions[0]?.node !== path.node) {
          return;
        }
        let { decorated } = state.currentObjectExpressions.shift()!;
        if (decorated.length > 0) {
          state.util.replaceWith(path, (i) =>
            t.callExpression(state.runtime(i, "p"), [
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
  };
}

export default function legacyDecoratorCompat(
  babel: typeof Babel
): Babel.PluginObj<State> {
  let visitor: Babel.Visitor<State> | undefined = makeVisitor(babel);
  return {
    inherits: (api: unknown, _options: unknown, dirname: unknown) =>
      decoratorSyntax(api, { legacy: true }, dirname),
    pre(this: State, file) {
      if (this.opts.runEarly) {
        babel.traverse(file.ast, makeVisitor(babel), file.scope, this);
        visitor = undefined;
      }
    },
    get visitor() {
      return visitor ?? {};
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
