import { module, test } from "qunit";
import { oldBuild, newBuild, Builder } from "./helpers.ts";
import { type LegacyClassDecorator } from "../src/runtime.ts";
import * as runtime from "../src/runtime.ts";

function classTests(title: string, build: Builder) {
  module(`${title}-Class`, () => {
    test("class expression mutation", (assert) => {
      let withColors: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let Example = build.expression(
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

    test("class expression replacement", (assert) => {
      let withColors: LegacyClassDecorator = (target) => {
        return class extends target {
          get red() {
            return "#ff0000";
          }
        };
      };

      let Example = build.expression(
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

      let Example = build.expression(
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

    test("export default class declaration with name", async (assert) => {
      let red: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let { default: Example, checkLocalName } = await build.module(
        `
      import red from "red";

      export default @red class X {
      }
      export function checkLocalName() {
        return X;
      }
      `,
        { "decorator-transforms/runtime": runtime, red: { default: red } }
      );
      assert.strictEqual(checkLocalName(), Example);
      assert.strictEqual(new Example().red, "#ff0000");
    });

    test("export default class declaration without name", async (assert) => {
      let red: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let { default: Example } = await build.module(
        `
      import red from "red";

      export default @red class {
      }
      `,
        { "decorator-transforms/runtime": runtime, red: { default: red } }
      );
      assert.strictEqual(new Example().red, "#ff0000");
    });

    test("export named class declaration", async (assert) => {
      let red: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let { Example, checkLocalName } = await build.module(
        `
          import red from "red";
          @red export class Example {
          }
          export function checkLocalName() {
            return Example;
          }
        `,
        { "decorator-transforms/runtime": runtime, red: { default: red } }
      );
      assert.strictEqual(checkLocalName(), Example);
      assert.strictEqual(new Example().red, "#ff0000");
    });

    test("standalone class declaration mutation", async (assert) => {
      let red: LegacyClassDecorator = (target) => {
        Object.defineProperty((target as any).prototype, "red", {
          get() {
            return "#ff0000";
          },
        });
      };

      let { Example } = await build.module(
        `
          import red from "red";

          @red 
          class Example {
          }

          export { Example }
        `,
        { "decorator-transforms/runtime": runtime, red: { default: red } }
      );

      assert.strictEqual(new Example().red, "#ff0000");
    });

    test("standalone class declaration replacement", async (assert) => {
      let red: LegacyClassDecorator = (target) => {
        return class extends target {
          get red() {
            return "#ff0000";
          }
        };
      };

      let { Example } = await build.module(
        `
          import red from "red";

          @red 
          class Example {
          }

          export { Example }
        `,
        { "decorator-transforms/runtime": runtime, red: { default: red } }
      );

      assert.strictEqual(new Example().red, "#ff0000");
    });
  });
}

classTests("old-build", oldBuild);
classTests("new-build", newBuild);
