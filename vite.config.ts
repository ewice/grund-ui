import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        accordion: 'src/components/accordion/index.ts',
        avatar: 'src/components/avatar/index.ts',
        checkbox: 'src/components/checkbox/index.ts',
        tabs: 'src/components/tabs/index.ts',
        toggle: 'src/components/toggle/index.ts',
        'toggle-group': 'src/components/toggle-group/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['lit', 'lit/decorators.js', 'lit/directives/class-map.js', '@lit/context'],
    },
    target: 'es2021',
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['@open-wc/testing'],
  },
});
