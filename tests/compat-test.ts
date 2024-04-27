import { module, test } from "qunit";
import { newBuild, compatNewBuild, featureAssertions } from "./helpers.ts";

module(`Compat`, (hooks) => {
  featureAssertions(hooks);

  test("uses real static blocks and private fields by default", (assert) => {
    const transformedSrc = newBuild.transformSrc(
      `
        class Example {
          @withColors myField;
        }
        `
    );
    assert.usesFeature(transformedSrc, "staticBlocks");
    assert.usesFeature(transformedSrc, "privateNames");
  });

  test("can transpile away all private fields and static blocks when using runEarly", (assert) => {
    const transformedSrc = compatNewBuild.transformSrc(
      `
        class Example {
          @withColors myField;
        }
        `
    );
    assert.doesNotUseFeature(transformedSrc, "staticBlocks");
    assert.doesNotUseFeature(transformedSrc, "privateNames");
  });
});
