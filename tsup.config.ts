import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    runtime: 'src/runtime.ts',
    globals: 'src/globals.ts',
  },
  format: ['esm', 'cjs'],
  target: 'es2022',
  clean: true,
  shims: true,
  sourcemap: true,
});
