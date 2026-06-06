import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: { proxy: { '/auth': 'http://localhost:3000', '/posts': 'http://localhost:3000', '/comments': 'http://localhost:3000' } },
});
