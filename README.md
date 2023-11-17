# decorator-transforms

Better babel transforms for decorators.

## Why?

A transform like `@babel/plugin-proposal-decorators` is still often necessary because it took Decorators a long time to move through the TC39 standardization process. But we can implement the same functionality in a much simpler way now that we can rely on the presence of features like class static block, private fields, and WeakMap.

In addition, we can provide better transitional paths between the widely used "legacy" decorators implementation that predated standization and the newer standardized form.

## Status

This is new and incomplete.
