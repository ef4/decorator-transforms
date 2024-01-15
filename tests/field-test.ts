import { module, test } from "qunit";
import { oldBuild, newBuild, Builder } from "./helpers.ts";
import { type LegacyDecorator } from "../src/runtime.ts";
import * as runtimeImpl from "../src/runtime.ts";
import { globalId } from "../src/global-id.ts";

const runtime = { [globalId]: runtimeImpl };

function fieldTests(title: string, build: Builder) {
  module(`${title}-ClassField`, () => {
    test("getter returning decorator", (assert) => {
      let log: any[] = [];

      let tracked: LegacyDecorator = function (_target, _prop, desc) {
        let value: any;
        let initialized = false;
        return {
          get() {
            if (!initialized) {
              initialized = true;
              value = desc.initializer?.call(this);
            }
            return value;
          },
          set(newValue: any) {
            log.push(newValue);
            value = newValue;
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          @tracked thing = 1;
        }
        `,
        { tracked, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      example.thing = 2;
      assert.strictEqual(example.thing, 2);
      assert.deepEqual(log, [2]);
    });

    test("noop on undecorated class fields", (assert) => {
      let Example = build.expression(
        `
        class Example {
          thing = 1;
        }
        `,
        {}
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      example.thing = 2;
      assert.strictEqual(example.thing, 2);
    });

    test("multiple decorator order", (assert) => {
      let log: any[] = [];

      function logAccess(message: string): LegacyDecorator {
        return function (_target, prop, desc) {
          let { initializer } = desc;
          let value: any;
          return {
            get() {
              log.push(`${message} ${prop}`);
              if (desc.get) {
                return desc.get();
              } else {
                if (initializer) {
                  value = initializer.call(this);
                  initializer = undefined;
                }
                return value;
              }
            },
          };
        };
      }

      let Example = build.expression(
        `
        class Example {
          @logAccess('a') @logAccess('b') thing = 1;
        }
        `,
        { logAccess, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      assert.deepEqual(log, [`a thing`, `b thing`]);
    });

    test("value-returning decorator", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
      class Example {
        @double thing = 3;
      }
      `,
        { double, ...runtime }
      );
      assert.strictEqual(new Example().thing, 6);
    });

    test("initializer this-context", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let tracked: LegacyDecorator = function (_target, _prop, desc) {
        let value: any;
        let initialized = false;
        return {
          get() {
            if (!initialized) {
              initialized = true;
              value = desc.initializer?.call(this);
            }
            return value;
          },
          set(newValue: any) {
            value = newValue;
          },
        };
      };

      let Example = build.expression(
        `
      class Example {
        first = 1;
        @tracked second = this.first + 1;
        @double third = this.second + 1;
      }
      `,
        { double, tracked, ...runtime }
      );
      assert.strictEqual(new Example().first, 1);
      assert.strictEqual(new Example().second, 2);
      assert.strictEqual(new Example().third, 6);
    });

    test("initializer is defined on descriptor", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            assert.ok("initializer" in desc, "initializer exists");
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
      class Example {
        @double first;
        @double second = 2
      }
      `,
        { double, ...runtime }
      );
      assert.strictEqual(new Example().first, 0);
      assert.strictEqual(new Example().second, 4);
    });

    test("initializes value-returning decorator per instance", (assert) => {
      let noop: LegacyDecorator = function (_target, _prop, desc) {
        return desc;
      };

      let counter = 3;
      let Example = build.expression(
        `
      class Example {
        @noop thing = counter++;
        @noop other = counter++;
      }
      `,
        { noop, counter, ...runtime }
      );
      let a = new Example();
      let b = new Example();
      assert.strictEqual(a.thing, 3);
      assert.strictEqual(a.other, 4);
      assert.strictEqual(b.thing, 5);
      assert.strictEqual(b.other, 6);
    });

    test("static field", (assert) => {
      let log: any[] = [];

      function logAccess(message: string): LegacyDecorator {
        return function (_target, prop, desc) {
          let { initializer } = desc;
          let value: any;
          return {
            get() {
              log.push(`${message} ${prop}`);
              if (desc.get) {
                return desc.get();
              } else {
                if (initializer) {
                  value = initializer.call(this);
                  initializer = undefined;
                }
                return value;
              }
            },
          };
        };
      }

      let Example = build.expression(
        `
      class Example {
        static first = 1;
  
        @logAccess('here')
        static second = this.first * 2;
      }
      `,
        { logAccess, ...runtime }
      );

      assert.equal(Example.second, 2, "should return value");
      assert.deepEqual(log, [`here second`]);
    });

    test("field with string literal name", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
    class Example {
      @double "the-thing" = 1
    }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a["the-thing"], 2);
    });

    test("field with numeric literal name", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
    class Example {
      @double 1 = 1
    }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a[1], 2);
    });

    test("field with bigint literal name", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
    class Example {
      @double 1n = 1
    }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a[1], 2);
    });

    test("avoids collision with existing private field", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          #n = 'unrelated';
          @double n = 1
        }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a.n, 2);
    });

    test("avoids collision with existing private method", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          #n() { return 'unrelated' }
          @double n = 1
        }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a.n, 2);
    });

    test("field within nested class handles name collisions correctly", (assert) => {
      let double: LegacyDecorator = function (_target, _prop, desc) {
        return {
          initializer: function () {
            return desc.initializer ? desc.initializer.call(this) * 2 : 0;
          },
        };
      };

      let Example = build.expression(
        `
        class Example {
          get inner() {
            class Inner {
              #n = 'unrelated';
              @double n = 1
            }
            return new Inner();
          }

          #m = 'unrelated';
          @double m = 5;
        }
    `,
        { double, ...runtime }
      );
      let a = new Example();
      assert.strictEqual(a.inner.n, 2);
      assert.strictEqual(a.m, 10);
    });
  });
}
fieldTests("old-build", oldBuild);
fieldTests("new-build", newBuild);
