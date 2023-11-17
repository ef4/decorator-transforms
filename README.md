# decorator-transforms

Better babel transforms for decorators.

## Why?

A transform like `@babel/plugin-proposal-decorators` is still often necessary because it took Decorators a long time to move through the TC39 standardization process. But that plugin's implementation was created in an earlier era, when it was acceptable to force transpilation of most other class features and before the availability of class static block.

Using class static block, we can do a slimmed down implementation that is much smaller and that allows us to keep our other class featues (fields, private fields, etc) untranspiled.

In addition, we can provide better transitional paths between the widely used "legacy" decorators implementation that predated standization and the newer standardized form.

## Status

This is new and incomplete.
