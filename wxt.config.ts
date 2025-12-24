import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  outDir: 'build',
  manifest: {
    permissions: ['activeTab', 'scripting'],
    web_accessible_resources: [
      {
        resources: ['tesseract/*'],
        matches: ['<all_urls>'],
      },
    ],
  },
  webExt: {
    disabled: true,
  }
});
