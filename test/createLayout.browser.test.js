import { assert, describe, test, inject } from 'vitest';

import { Entity } from '../src/model/models.js';
import extract from '../src/lib/extract.js';
import createLayout from '../src/lib/createLayout.js';

describe( 'createLayout', async () => {

  // get fixtures
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



  test( 'shows no title if a system is a blank node and has no label', async () => {

    // parse and layout
    const variables = await extract( turtles['test\\_fixture\\issue004.ttl'] );
    const layout = await createLayout( variables[0] );

    // assert
    assert.isArray( layout.boxes, 'should contain a list of boxes' );
    const system = layout.boxes.find( (el) => (el.comp instanceof Entity) && (el.comp.isSystem()) );
    assert.deepEqual( system.texts.map( (el) => el.text ), [ 'AsymmetricSystem' ], 'should only contain the header but not title' );

  });



  test( 'shows proper arrows for different number of constraints in system components', async () => {

    // parse and layout
    const variables = await extract( turtles['test\\_fixture\\issue005.ttl'] );
    const layout = await createLayout( variables[0] );

    // assert
    assert.isArray( layout.arrows, 'should contain a list of arrows' );
    const hasConstraintArrows = layout.arrows.filter( (a) => a.type == 'hasConstraint' );
    const headedArrows = hasConstraintArrows.filter( (a) => !a.hideHead );
    const textArrow = hasConstraintArrows.filter( (a) => a.text );
    assert.equal( headedArrows.length, 2, 'should have two arrows with heads' );
    assert.equal( textArrow.length, 1, 'should have one arrow with a label' );
    const lowerCoord = (path) => Math.max( ... path.map( (p) => p.y ) );
    const textLowerCoord    = lowerCoord( textArrow[0].path );
    const headedLowerCord1  = lowerCoord( headedArrows[0].path );
    const headedLowerCord2  = lowerCoord( headedArrows[1].path );
    assert.ok( headedLowerCord1 === textLowerCoord, 'headed arrows should start at non-headed line' );
    assert.ok( headedLowerCord2 === textLowerCoord, 'headed arrows should start at non-headed line' );

  });

});



// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Helper XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


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
