// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const dir = import.meta.dirname;

export default defineConfig({
  build: {
    sourcemap: true,
    minify: false,
    outDir: 'dist',
    lib: {
      formats: ['es', 'cjs'],
      entry: [
        resolve(dir, 'src/index.ts'),
        resolve(dir, 'src/runtime.ts'),
        resolve(dir, 'src/globals.ts'),
      ],
      name: 'decorator-transforms',
    },
  },
  plugins: [dts()],
});
