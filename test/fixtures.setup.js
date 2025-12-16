import { promises as Fs } from 'node:fs';
import { test as base } from 'vitest';

export const test = base.extend({

  // load all turtle files
  turtles: async ({}, use) => {

    // fetch ttl files
    const files = {};
    for await (const file of Fs.glob( '**/*.ttl' ) ) {
      files[ file ] = await Fs.readFile( file, 'utf8' );
    }
    await use(files);

  },

});