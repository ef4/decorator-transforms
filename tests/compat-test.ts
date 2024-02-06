import { module, test } from "qunit";
import { newBuild, compatNewBuild } from "./helpers.ts";

module(`Compat`, () => {
  test("uses real static blocks when staticBlocks: native", (assert) => {
    const transformedSrc = newBuild.transformSrc(
      `
        class Example {
          @withColors myField;
        }
        `
    );
    assert.true(transformedSrc.includes("static {"));
  });

  test("uses private static class fields when staticBlocks: fields", (assert) => {
    const transformedSrc = compatNewBuild.transformSrc(
      `
        class Example {
          @withColors myField;
        }
        `
    );
    assert.false(transformedSrc.includes("static {"));
  });
});
