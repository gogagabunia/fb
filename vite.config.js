import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        marketplace: resolve(__dirname, 'marketplace.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        importedPosts: resolve(__dirname, 'imported-posts.html'),
        addGroup: resolve(__dirname, 'add-group.html'),
        listingDetail: resolve(__dirname, 'listing-detail.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
