import { module, test } from 'qunit';
import { oldBuild, newBuild, Builder, compatNewBuild } from './helpers.ts';
import { type LegacyDecorator } from '../src/runtime.ts';
import * as runtimeImpl from '../src/runtime.ts';
import { globalId } from '../src/global-id.ts';
const runtime = { [globalId]: runtimeImpl };

function methodTests(title: string, build: Builder) {
  module(`${title}-ClassMethod`, () => {
    test('noop on undecorated class method', (assert) => {
      let Example = build.expression(
        `
        class Example {
          doIt(){ return 1 };
        }
        `,
        {},
      );
      let example = new Example();
      assert.strictEqual(example.doIt(), 1);
    });

    test('intercepting', (assert) => {
      let log: any[] = [];
      let intercept: LegacyDecorator = (_target, _prop, desc) => {
        let { value } = desc;
        if (!value) {
          throw new Error(`intercept only works on methods`);
        }
        return {
          ...desc,
          value: function (...args: any[]) {
            log.push(args[0]);
            return value(...args);
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          @intercept
          doIt(){ return 1 };
        }
        `,
        { intercept, ...runtime },
      );
      let example = new Example();
      assert.strictEqual(example.doIt('a'), 1);
      assert.deepEqual(log, ['a']);
    });

    test('getter', (assert) => {
      let log: any[] = [];
      let intercept: LegacyDecorator = (_target, _prop, desc) => {
        const { get } = desc;
        if (!get) {
          throw new Error(`intercept only works on getters`);
        }
        return {
          ...desc,
          get: function () {
            log.push('it ran');
            return get.call(this);
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          count = 1

          @intercept
          get value(){ return this.count };
        }
        `,
        { intercept, ...runtime },
      );
      let example = new Example();
      assert.strictEqual(example.value, 1);
      assert.deepEqual(log, ['it ran']);
    });

    test('static getter', (assert) => {
      let log: any[] = [];
      let intercept: LegacyDecorator = (_target, _prop, desc) => {
        const { get } = desc;
        if (!get) {
          throw new Error(`intercept only works on getters`);
        }
        return {
          ...desc,
          get: function () {
            log.push('it ran');
            return get.call(this);
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          static count = 1

          @intercept
          static get value(){ return this.count };
        }
        `,
        { intercept, ...runtime },
      );
      assert.strictEqual(Example.value, 1);
      assert.deepEqual(log, ['it ran']);
    });

    test('pojo getter', (assert) => {
      let log: any[] = [];
      let intercept: LegacyDecorator = (_target, _prop, desc) => {
        const { get } = desc;
        if (!get) {
          throw new Error(`intercept only works on getters`);
        }
        return {
          ...desc,
          get: function () {
            log.push('it ran');
            return get.call(this);
          },
        };
      };

      let Example = build.expression(
        `
        {
          count: 1,

          @intercept
          get value(){ return this.count }
        }
        `,
        { intercept, ...runtime },
      );
      assert.strictEqual(Example.value, 1);
      assert.deepEqual(log, ['it ran']);
    });

    test('method with string literal name', (assert) => {
      let noop: LegacyDecorator = (_target, _prop, desc) => desc;

      let Example = build.expression(
        `
        class Example {
          @noop
          "doIt"(){ return 1 };
        }
        `,
        { noop, ...runtime },
      );
      let example = new Example();
      assert.strictEqual(example.doIt('a'), 1);
    });

    test('method with numeric literal name', (assert) => {
      let noop: LegacyDecorator = (_target, _prop, desc) => desc;

      let Example = build.expression(
        `
        class Example {
          @noop
          123(){ return 1 };
        }
        `,
        { noop, ...runtime },
      );
      let example = new Example();
      assert.strictEqual(example[123]('a'), 1);
    });

    test('method with bigint literal name', (assert) => {
      let noop: LegacyDecorator = (_target, _prop, desc) => desc;

      let Example = build.expression(
        `
        class Example {
          @noop
          123n(){ return 1 };
        }
        `,
        { noop, ...runtime },
      );
      let example = new Example();
      assert.strictEqual(example[123]('a'), 1);
    });

    test('method on object literal', (assert) => {
      let log: any[] = [];
      let intercept: LegacyDecorator = (_target, _prop, desc) => {
        let { value } = desc;
        if (!value) {
          throw new Error(`intercept only works on methods`);
        }
        return {
          ...desc,
          value: function (...args: any[]) {
            log.push(args[0]);
            return value(...args);
          },
        };
      };

      let example = build.expression(`{ @intercept value(){ return  1 } }`, {
        intercept,
        ...runtime,
      });
      assert.strictEqual(example.value('a'), 1);
      assert.deepEqual(log, ['a']);
    });
  });
}

methodTests('old-build', oldBuild);
methodTests('new-build', newBuild);
methodTests('compat-new-build', compatNewBuild);
