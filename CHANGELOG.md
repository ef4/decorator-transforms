# Changelog

## Release (2024-11-05)

decorator-transforms 2.2.3 (patch)

#### :bug: Bug Fix
* `decorator-transforms`
  * [#37](https://github.com/ef4/decorator-transforms/pull/37) Don't use node APIs (require) ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### :house: Internal
* `decorator-transforms`
  * [#40](https://github.com/ef4/decorator-transforms/pull/40) Update release-plan ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#38](https://github.com/ef4/decorator-transforms/pull/38) Prettier ([@NullVoxPopuli](https://github.com/NullVoxPopuli))
  * [#39](https://github.com/ef4/decorator-transforms/pull/39) Set a pnpm via packageManager ([@NullVoxPopuli](https://github.com/NullVoxPopuli))

#### Committers: 1
- [@NullVoxPopuli](https://github.com/NullVoxPopuli)

## Release (2024-10-01)

decorator-transforms 2.2.2 (patch)

#### :bug: Bug Fix
* `decorator-transforms`
  * [#35](https://github.com/ef4/decorator-transforms/pull/35) Remove unintentional change that was part of #33 ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## Release (2024-10-01)

decorator-transforms 2.2.1 (patch)

#### :bug: Bug Fix
* `decorator-transforms`
  * [#33](https://github.com/ef4/decorator-transforms/pull/33) Fix unbalanced exit ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## Release (2024-09-19)

decorator-transforms 2.2.0 (minor)

#### :rocket: Enhancement
* `decorator-transforms`
  * [#31](https://github.com/ef4/decorator-transforms/pull/31) Publish types ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## Release (2024-09-17)

decorator-transforms 2.1.0 (minor)

#### :rocket: Enhancement
* `decorator-transforms`
  * [#30](https://github.com/ef4/decorator-transforms/pull/30) Offer an explicit import path for esm vs cjs runtime ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## Release (2024-04-27)

decorator-transforms 2.0.0 (major)

#### :boom: Breaking Change
* `decorator-transforms`
  * [#26](https://github.com/ef4/decorator-transforms/pull/26) Implement runEarly for arbitrary browser compatibility ([@ef4](https://github.com/ef4))

#### :house: Internal
* `decorator-transforms`
  * [#19](https://github.com/ef4/decorator-transforms/pull/19) Test interop with template-colocation-plugin ([@ef4](https://github.com/ef4))

#### Committers: 1
- Edward Faulkner ([@ef4](https://github.com/ef4))

## Release (2024-04-16)

decorator-transforms 1.2.1 (patch)

#### :bug: Bug Fix
* `decorator-transforms`
  * [#24](https://github.com/ef4/decorator-transforms/pull/24) add a prepare script to make sure it builds ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-04-16)

decorator-transforms 1.2.0 (minor)

#### :rocket: Enhancement
* `decorator-transforms`
  * [#17](https://github.com/ef4/decorator-transforms/pull/17) Replace static blocks with private static field initializers ([@davidtaylorhq](https://github.com/davidtaylorhq))

#### :house: Internal
* `decorator-transforms`
  * [#22](https://github.com/ef4/decorator-transforms/pull/22) add release-plan ([@mansona](https://github.com/mansona))

#### Committers: 2
- Chris Manson ([@mansona](https://github.com/mansona))
- David Taylor ([@davidtaylorhq](https://github.com/davidtaylorhq))

# 1.1.0 (2024-01-15)

- ENHANCEMENT: implement field and method decorators on plain javascript objects
- BUGFIX: fix naming collisions with existing private fields

# 1.0.3 (2024-01-04)

- BUGFIX: v1.0.2 was not runtime-compatible with prior 1.x releases, so mixing versions would cause errors. This restores the stable API between them.

# 1.0.2 (2024-01-03)

- BUGFIX: support decorating static fields and static methods

# 1.0.1 (2023-11-20)

- BUGFIX: support fields and methods with names that are string literals, numeric literals, bigint literals, or computed expressions
- BUGFIX: pass `initializer: null` to field decortors when there is no initial value, for consistency with older implementation.

# 1.0.0 (2023-11-18)

- First feature-complete release
