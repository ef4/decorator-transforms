import { module, test, skip } from "qunit";
import { oldBuild, newBuild, Builder } from "./helpers.ts";
import { type LegacyClassDecorator } from "../src/runtime.ts";
import * as runtime from "../src/runtime.ts";

function compatTests(title: string, build: Builder) {
  module(`${title}-Class`, () => {
    test("class mutation", (assert) => {
      let withColors: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let Example = build(
        `
        @withColors
        class Example {
        }
        `,
        { withColors, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.red, "#ff0000");
    });

    skip("class replacement", (assert) => {
      let withColors: LegacyClassDecorator = (target) => {
        return class extends target {
          get red() {
            return "#ff0000";
          }
        };
      };

      let Example = build(
        `
        @withColors
        class Example {
        }
        `,
        { withColors, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.red, "#ff0000");
    });

    test("order", (assert) => {
      let log: string[] = [];
      function addColor(name: string, value: string): LegacyClassDecorator {
        return (target) => {
          log.push(`added ${name}`);
          Object.defineProperty((target as any).prototype, name, {
            writable: false,
            value,
          });
        };
      }

      let Example = build(
        `
        @addColor("red", "#ff0000")
        @addColor("blue", "#0000ff")
        class Example {
        }
        `,
        { addColor, ...runtime }
      );
      let example = new Example();
      assert.strictEqual(example.red, "#ff0000");
      assert.strictEqual(example.blue, "#0000ff");
      assert.deepEqual(log, ["added blue", "added red"]);
    });
  });
}

compatTests("old-build", oldBuild);
compatTests("new-build", newBuild);
