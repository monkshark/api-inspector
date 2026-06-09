import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
  manifest_version: 3,
  name: 'API Inspector',
  version: '1.0.0',
  description:
    'Capture API requests in a DevTools panel and convert them to cURL/HTTPie/Postman. Local-only, no network interception permission.',
  minimum_chrome_version: '116',
  permissions: ['storage'],
  devtools_page: 'src/devtools/devtools.html',
  background: {
    service_worker: 'src/background/sw.ts',
    type: 'module',
  },
  action: {
    default_title: 'API Inspector — open viewer',
  },
  web_accessible_resources: [
    {
      resources: ['src/panel/index.html', 'src/viewer/index.html'],
      matches: ['<all_urls>'],
    },
  ],
})
