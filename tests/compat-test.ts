import { module, test } from "qunit";
import { legacyBuild, Builder } from "./helpers.ts";

interface Descriptor {
  configurable?: boolean;
  enumerable?: boolean;
  writable?: boolean;
  get?(): any;
  set?(v: any): void;
  initializer?: () => any;
}
type LegacyDecorator = (
  target: object,
  prop: string,
  desc: Descriptor
) => Descriptor | null;

function compatTests(title: string, build: Builder) {
  module(title, () => {
    test("smoke", (assert) => {
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
        { tracked }
      );
      let example = new Example();
      assert.strictEqual(example.thing, 1);
      example.thing = 2;
      assert.strictEqual(example.thing, 2);
      assert.deepEqual(log, [2]);
    });
  });
}

compatTests("@babel/plugin-proposal-decorators", legacyBuild);
