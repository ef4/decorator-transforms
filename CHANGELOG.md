# Changelog

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
