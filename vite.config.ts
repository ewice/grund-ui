import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        accordion: 'src/components/accordion/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js', '@lit/context'],
    },
    target: 'es2021',
    outDir: 'dist',
  },
});
