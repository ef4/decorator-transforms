# decorator-transforms

Better babel transforms for decorators.

## Why?

A transform like `@babel/plugin-proposal-decorators` is still often necessary because it took Decorators a long time to move through the TC39 standardization process. But we can implement the same functionality in a much simpler way now that we can rely on the presence of features like class static block, private fields, and WeakMap.

## Status

This is new and incomplete. I have implemented class fields and class methods.

## Trying this in an Ember App

1. Install the `decorator-transforms` package (you're going to use ember-auto-import to get its runtime helpers, so it needs to be listed in your package.json).
2. In `ember-cli-build.js`:

   ```js
   new EmberApp(defaults, {
     'ember-cli-babel': {
        // turn off the old transform
        disableDecoratorTransforms: true,
      },
      babel: {
        plugins: [
          // add the new transform
          require.resolve('decorator-transforms'),
        ],
      },
   )
   ```

3. At the beginning of `app.js`, install the runtime helpers:

   ```js
   import "decorator-transforms/globals";
   ```
