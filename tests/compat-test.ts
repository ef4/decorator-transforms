import { module, test } from "qunit";
import { oldBuild, newBuild, Builder } from "./helpers.ts";
import { applyDecorator, type LegacyDecorator } from "../src/runtime.ts";

function compatTests(title: string, build: Builder) {
  module(title, () => {
    test("prototype descriptor", (assert) => {
      let log: any[] = [];

      let tracked: LegacyDecorator = function (_target, _prop, desc) {
        let value: any;
        let initialized = false;
        return {
          get() {
            if (!initialized) {
              initialized = true;
              value = desc.initializer?.();
            }
            return value;
          },
          set(newValue: any) {
            log.push(newValue);
            value = newValue;
          },
        };
      };

      let Example = build(
        `
        class Example {
          @tracked thing = 1;
        }
        `,
        { tracked, applyDecorator }
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      example.thing = 2;
      assert.strictEqual(example.thing, 2);
      assert.deepEqual(log, [2]);
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
                  value = initializer();
                  initializer = undefined;
                }
                return value;
              }
            },
          };
        };
      }

      let Example = build(
        `
        class Example {
          @logAccess('a') @logAccess('b') thing = 1;
        }
        `,
        { logAccess, applyDecorator }
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      assert.deepEqual(log, [`a thing`, `b thing`]);
    });
  });
}

compatTests("old-build", oldBuild);
compatTests("new-build", newBuild);
