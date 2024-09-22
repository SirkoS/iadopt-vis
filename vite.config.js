import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        appRemote: fileURLToPath(new URL('./remote.html', import.meta.url)),
        appMain:   fileURLToPath(new URL('./index.html', import.meta.url)),
      },
    },
  },
});