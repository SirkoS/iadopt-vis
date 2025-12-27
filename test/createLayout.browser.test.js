import { assert, describe, test, inject } from 'vitest';

import { Entity } from '../src/model/models.js';
import extract from '../src/lib/extract.js';
import createLayout from '../src/lib/createLayout.js';
import { VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS, VALID_ASYMMETRIC_SYSTEM_PROPERTIES } from '../src/model/models.js';

describe.only( 'createLayout', async () => {

  // get fixtures
  const turtles = inject( 'ttl' );


  for await (const [ file, ttl ] of Object.entries( turtles ) ) {
    test( `property-based tests for ${file}`, async () => {

      // parse and layout
      const variables = await extract( ttl );
      const layout = await createLayout( variables[0] );

      // preconditions
      assert.isArray( variables, 'should return a list of Variables' );
      assert.equal( variables.length, 1, 'should return exactly one Variable' );

      // make sure no boxes are overlapping
      for( const boxA of layout.boxes ) {

        // all coordinates should be numbers
        assert.isFinite( boxA.x, 'should have a number for x-coordinate' );
        assert.isFinite( boxA.y, 'should have a number for y-coordinate' );
        assert.isFinite( boxA.width, 'should have a number for width' );
        assert.isFinite( boxA.height, 'should have a number for height' );
        assert.isFinite( boxA.descSeparator, 'should have a number for descSeparator' );
        for( const t of boxA.texts ){
          assert.isFinite( t.x, 'should have a number for x-coordinate of all text' );
          assert.isFinite( t.y, 'should have a number for y-coordinate of all text' );
        }

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

      // for all AsymmetricSystems, keep order of properties
      const asymArrows = layout.arrows.filter( (a) => VALID_ASYMMETRIC_SYSTEM_PROPERTIES.includes( a.text ) );
      if( asymArrows.length > 0 ) {

        // sanity check
        assert.ok( asymArrows.length % 2 == 0, 'should contain pairs of asymmetric properties' );

        // sort by x-coordinate, so we have them in proper pairs
        asymArrows.sort( (a,b) => a.x - b.x );
        for( let i=0; i<asymArrows.length; i+=2 ) {

          // find property pair
          const propPair = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS.find( (pair) => pair.includes( asymArrows[i].text ) );

          // check proper order
          assert.equal( propPair.findIndex( (el) => el == asymArrows[i].text ),   0, 'should have the correct property in first position' );
          assert.equal( propPair.findIndex( (el) => el == asymArrows[i+1].text ), 1, 'should have the correct property in second position' );

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
