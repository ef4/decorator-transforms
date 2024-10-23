import { module, test } from 'qunit';
import { builder } from './helpers.ts';
import { type LegacyClassDecorator } from '../src/runtime.ts';
import * as runtimeImpl from '../src/runtime.ts';
import ourDecorators from '../src/index.ts';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type * as Babel from '@babel/core';

const require = createRequire(import.meta.url);
const Colocation = require('@embroider/shared-internals/src/template-colocation-plugin');

module('plugin-interop', () => {
  test('colocation', async (assert) => {
    let dir = await mkdtemp(join(tmpdir(), 'decorator-transforms-'));
    await writeFile(join(dir, 'example.hbs'), '');
    let build = builder(
      [],
      [
        [
          ourDecorators,
          { runtime: { import: 'decorator-transforms/runtime' } },
        ],
        [Colocation],
      ],
      [],
      join(dir, 'example.js'),
    );
    let red: LegacyClassDecorator = (target) => {
      return class extends target {
        get red() {
          return '#ff0000';
        }
      };
    };

    let setComponents = 0;

    let { default: Example } = await build.module(
      `
        import red from "red";
        import { precompileTemplate } from '@ember/template-compilation';

        const __COLOCATED_TEMPLATE__ = precompileTemplate("Hello world")

        @red 
        export default class Example {
        }

      `,
      {
        'decorator-transforms/runtime': runtimeImpl,
        red: { default: red },
        '@ember/component': {
          setComponentTemplate: function (_template: unknown, obj: unknown) {
            setComponents++;
            return obj;
          },
        },
        '@ember/template-compilation': {
          precompileTemplate: function (a: string) {
            return a;
          },
        },
        './example.hbs': {
          default: '',
        },
      },
    );

    assert.strictEqual(new Example().red, '#ff0000');
    assert.strictEqual(setComponents, 1);
  });

  // This models a behavior that @embroider/macros uses when trying to optimize
  // `getConfig().with.a.path`, since it uses parentPath to go higher and
  // replace a larger part of the expression.
  test('parentPath replace', async (assert) => {
    function inserter(babel: typeof Babel): Babel.PluginObj {
      let t = babel.types;
      return {
        visitor: {
          CallExpression: {
            enter(path) {
              let callee = path.node.callee;
              if (callee.type === 'Identifier' && callee.name === 'expandMe') {
                path.parentPath.replaceWith(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('value'),
                      t.stringLiteral('it worked'),
                    ),
                  ]),
                );
              }
            },
          },
        },
      };
    }

    let build = builder(
      [],
      [
        [
          ourDecorators,
          { runtime: { import: 'decorator-transforms/runtime' } },
        ],
        [inserter],
      ],
      [],
    );

    let { default: Example } = await build.module(
      `
        export default expandMe().a;
      `,
      {},
    );

    assert.strictEqual(Example.value, 'it worked');
  });
});
