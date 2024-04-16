# Changelog

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
