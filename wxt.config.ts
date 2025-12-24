import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: 'build',
  manifest: {
    permissions: ['activeTab', 'scripting'],
  },
  webExt: {
    disabled: true,
  }
});
