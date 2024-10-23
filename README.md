# decorator-transforms

Better babel transforms for decorators.

## Why?

A transform like `@babel/plugin-proposal-decorators` is still often necessary because it took Decorators a long time to move through the TC39 standardization process. But we can implement the same functionality in a much simpler way now that we can rely on the presence of features like class static block, private fields, and WeakMap. This results in significantly smaller code and avoids the need to transpile other class features.

## Status

This is in use in several large, legacy codebases. As far as I can tell, it implements the complete API surface of `['@babel/plugin-proposal-decorators', { legacy: true }]`. Please report any differences, we aim for bug-for-bug compatibility.

## Browser Support

Under our default settings, browsers will need to support

- private fields
- static blocks
- WeakMap

If you use the `runEarly: true` option (see below) in conjunction with an appropriately-configured `@babel/preset-env`, browsers will only need to support

- WeakMap

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
      'decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime'),
        },
      },
    ],
  ];
}
```

### runEarly

By default, `decorator-transforms` runs like any normal babel plugin. This works fine when you're targeting any browsers that natively support private fields and static blocks.

But if you try to transpile away private fields or static blocks, the fairly aggressive timing of those transforms in `@babel/preset-env` means that they will run first and

1.  Incorrectly tell you to install `@babel/plugin-transform-decorators` (which you don't need because you have `decorator-transforms`).
2.  Fail to transpile-away the private fields and static blocks emitted by `decorator-transforms`.

The solution to both problems is setting `runEarly: true` on `decorator-transforms`. This setting is not the default because it does incur the cost of an extra traversal in babel's `pre` phase.

## A Note on Naming Conventions

If you try to use the string name "decorator-transforms" in a babel config file, babel will assume you mean the NPM package "babel-plugin-decorator-transforms". This is a terrible convention. The solution is to use the string "module:decorator-transforms" instead.

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
   import 'decorator-transforms/globals';
   ```

   In classic builds, `"globals"` is the only `runtime` setting that works because ember-auto-import cannot see the output of this babel transform.

   In Embroider (post https://github.com/embroider-build/embroider/pull/1673), you can use `runtime: { import: require.resolve("decorator-transforms/runtime") }` and then you don't need to manually install the globals.
