import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset(), '@babel/preset-typescript'],
      // Enable TypeScript-style legacy decorators so inversify (@injectable,
      // @inject) and mobx (@observable, @action, @computed) work end-to-end.
      // The class-properties plugin must run AFTER the decorators plugin
      // (babel applies plugins in order), so keep decorators first.
      plugins: [
        'babel-plugin-transform-typescript-metadata',
        ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
        ['@babel/plugin-transform-class-properties', { loose: true }],
      ],
    }),
  ],
});
