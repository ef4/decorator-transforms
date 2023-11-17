import { module, test } from "qunit";
import { oldBuild, newBuild, Builder } from "./helpers.ts";
import { type LegacyDecorator } from "../src/runtime.ts";
import * as runtime from "../src/runtime.ts";

function compatTests(title: string, build: Builder) {
  module(`${title}-ClassMethod`, () => {
    test("noop on undecorated class method", (assert) => {
      let Example = build(
        `
        class Example {
          doIt(){ return 1 };
        }
        `,
        {}
      );
      let example = new Example();
      assert.strictEqual(example.doIt(), 1);
    });

    test("intercepting", (assert) => {
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

      let Example = build(
        `
        class Example {
          @intercept
          doIt(){ return 1 };
        }
        `,
        { intercept, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.doIt("a"), 1);
      assert.deepEqual(log, ["a"]);
    });
  });
}

compatTests("old-build", oldBuild);
compatTests("new-build", newBuild);
