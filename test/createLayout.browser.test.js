import { assert, describe, test, inject } from 'vitest';

import extract from '../src/lib/extract.js';
import createLayout from '../src/lib/createLayout.js';

describe( 'createLayout', async () => {

  const turtles = inject( 'ttl' );

  for await (const [ file, ttl ] of Object.entries( turtles ) ) {

    test( `creates layout for ${file}`, async () => {

      // parse and layout
      const variables = await extract( ttl );
      const layout = await createLayout( variables[0] );

      // make sure no boxes are overlapping
      for( const boxA of layout.boxes ) {
        for( const boxB of layout.boxes ) {

          // skip self-references
          if( boxA == boxB ) {
            continue;
          }

          // overlap
          assert.notOk( contains( boxA, boxB ), `should not contain overlapping boxes: ${boxA.comp.getRole()} ("${boxA.comp.getLabel()}") within ${boxB.comp.getRole()} ("${boxB.comp.getLabel()}")` );
          assert.notOk( contains( boxB, boxA ), `should not contain overlapping boxes: ${boxB.comp.getRole()} ("${boxB.comp.getLabel()}") within ${boxA.comp.getRole()} ("${boxA.comp.getLabel()}")` );

        }
      }

    }, 5_000 );
  }

});



/**
 * check if two given boxes overlap
 *
 * @param {import('../src/lib/createLayout.js').Box} boxA
 * @param {import('../src/lib/createLayout.js').Box} boxB
 * @returns
 */
function contains( boxA, boxB ) {

  return (
    // upper left corner in the box
    (
      (boxA.x >= boxB.x) && (boxA.x <= boxB.x + boxB.width)
      && (boxA.y >= boxB.y) && (boxA.y <= boxB.y + boxB.height)
    )
    ||
    // lower right corner in the box
    (
      (boxA.x + boxA.width >= boxB.x) && (boxA.x + boxA.width <= boxB.x + boxB.width)
      && (boxA.y + boxA.height >= boxB.y) && (boxA.y + boxA.height <= boxB.y + boxB.height)
    )
  );

};
