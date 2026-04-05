import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        accordion: 'src/components/accordion/accordion.ts',
        checkbox: 'src/components/checkbox/checkbox.ts',
        tabs: 'src/components/tabs/tabs.ts',
        toggle: 'src/components/toggle/toggle.ts',
        'toggle-group': 'src/components/toggle-group/toggle-group.ts',
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
