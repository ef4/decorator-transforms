# decorator-transforms

Better babel transforms for decorators.

## Why?

A transform like `@babel/plugin-proposal-decorators` is still often necessary because it took Decorators a long time to move through the TC39 standardization process. But we can implement the same functionality in a much simpler way now that we can rely on the presence of features like class static block, private fields, and WeakMap. This results in significantly smaller code and avoids the need to transpile other class features.

## Status

This is new and not yet heavily tested. As far as I can tell, it does implement the complete API surface of `['@babel/plugin-proposal-decorators', { legacy: true }]`, please try it and report bugs.

## Options

### runtime

The `runtime` option controls how the emitted code will find the (small) runtime helper module. You can set it to:

- `"globals"` (_default_), which means the helpers must be installed in a global variable.
  You can install them by adding `import "decorator-transform/globals"` at the
  very beginning of your app.
- `{ import: "some-module-path" }`, which means the helpers will be imported as needed from the module path you specify. The module path `"decorator-transforms/runtime"` is available within this package for this purpose, but keep in mind that it might not always work if you're transpiling third-party dependencies that cannot necessarily resolve your app's dependencies. In that case you might want to `require.resolve` it to an absolute path instead.

Example Config:

```js
{
  plugins: [
    [
      "decorator-transforms",
      {
        runtime: {
          import: require.resolve("decorator-transforms/runtime"),
        },
      },
    ],
  ];
}
```

### staticBlock

The `staticBlock` option controls how `decorator-transforms` outputs static class blocks:

- `"native"` (_default_) will output native `static { }` blocks ([caniuse](https://caniuse.com/mdn-javascript_classes_static_initialization_blocks))
- `"fields"` will shim the same functionality using private static class fields. These have slightly wider browser support. ([caniuse](https://caniuse.com/?search=static%20class%20fields))

## Trying this in an Ember App

1. Install the `decorator-transforms` package.
2. In `ember-cli-build.js`:

   ```js
   new EmberApp(defaults, {
     'ember-cli-babel': {
        // turn off the old transform
        // (for this to work when using Embroider you need https://github.com/embroider-build/embroider/pull/1673)
        disableDecoratorTransforms: true,
      },
      babel: {
        plugins: [
          // add the new transform.
          require.resolve('decorator-transforms'),
        ],
      },
   )
   ```

3. At the beginning of `app.js`, install the global runtime helpers:

   ```js
   import "decorator-transforms/globals";
   ```

   In classic builds, `"globals"` is the only `runtime` setting that works because ember-auto-import cannot see the output of this babel transform.

   In Embroider (post https://github.com/embroider-build/embroider/pull/1673), you can use `runtime: require.resolve("decorator-transforms/runtime")` and then you don't need to manually install the globals.
