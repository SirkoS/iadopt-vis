import { assert, describe, inject, test } from 'vitest';

import extract from '../src/lib/extract.js';
import parseJSONLD from '../src/model/parseJSONLD.js';
import toJSONLD from '../src/model/toJSONLD.js';



describe( 'toJSONLD / parseJSONLD', () => {

  // get fixtures
  const turtles = inject( 'ttl' );


  test.only( 'keeps exact content through a cycle of toJSONLD and fromJSONLD', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\issue008.ttl'] );
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const before = result[0];

    // action
    const after = parseJSONLD( toJSONLD( before ) );

    // validation
    assert.equal( after.getLabel(), before.getLabel(), 'should keep the Variable label intact' );

    const beforeOoi = before.getObjectOfInterest();
    const afterOoI = after.getObjectOfInterest();
    assert.equal( afterOoI.isBlank(), beforeOoi.isBlank(), 'should keep the blank-node-characteristic of entities' );
    assert.isUndefined( afterOoI.getLabel(), 'should not have a label for the OoI' );

    const beforeProp = before.getProperty();
    const afterProp = after.getProperty();
    assert.equal( afterProp.getLabel(), beforeProp.getLabel(),  'should keep the label of the Property' );
    assert.equal( afterProp.getIri(),   beforeProp.getIri(),    'should keep the IRI of the Property' );

  });


});


