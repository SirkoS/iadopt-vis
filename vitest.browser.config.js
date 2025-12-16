import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { promises as Fs } from 'node:fs';

// fetch ttl files
const ttlFiles = {};
for await (const file of Fs.glob( '**/*.ttl' ) ) {
  ttlFiles[ file ] = await Fs.readFile( file, 'utf8' );
}

export default defineConfig({
  test: {
    projects:[

      {
        test:{
          extends: true,
          name: 'browser',
          include: [
            'test/**/*.browser.{test,spec}.js',
          ],
          enabled: true,
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              { browser: 'chromium' },
            ],
            headless: true,
            screenshotFailures: false,
          }
        }
      },

      {
        test:{
          extends: true,
          name: 'node',
          include: [
            'test/**/*.unit.{test,spec}.js',
          ],
          enabled: true,
          environment: 'node',
        }
      },

    ],
    provide:{
      ttl: ttlFiles,
    }
  },
});
