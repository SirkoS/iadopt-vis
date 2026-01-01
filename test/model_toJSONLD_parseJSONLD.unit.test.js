import { assert, describe, inject, test } from 'vitest';

import extract from '../src/lib/extract.js';
import parseJSONLD from '../src/model/parseJSONLD.js';
import toJSONLD from '../src/model/toJSONLD.js';



describe( 'toJSONLD / parseJSONLD', () => {

  // get fixtures
  const turtles = inject( 'ttl' );


  test( 'keeps exact content through a cycle of toJSONLD and fromJSONLD', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\issue008.ttl'] );
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const before = result[0];
    assert.ok( before.getObjectOfInterest().isBlank(), 'should have a blank node OoI before' );

    // action
    const serialized = toJSONLD( before );
    const after = parseJSONLD( serialized );

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



  test( 'can handle blank nodes in Entities', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\issue010.ttl'] );
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const before = result[0];
    assert.isOk( before.getObjectOfInterest().isBlank(),  'should have blank node OoI before' );
    assert.isOk( before.getMatrix().isBlank(),            'should have blank node Matrix before' );
    assert.equal( before.getObjectOfInterest().getConstraints().length, 1,  'should have a constraint on the OoI before' );
    assert.equal( before.getMatrix().getConstraints().length, 0,            'should have no constraint on the OoI before' );

    // action I: serializing
    const serialized = toJSONLD( before );

    // validation I
    assert.isString( serialized['ooi']['@id'],    'should have some IRI for OoI in serialization' );
    assert.isString( serialized['matrix']['@id'], 'should have some IRI for Matrix in serialization' );
    assert.include( serialized['constraint'][0]['constrains'], serialized['ooi']['@id'], 'should have the constraint on the OoI in serialization' );

    // action II: deserializing
    const deserialized = parseJSONLD( serialized );

    // validation II
    assert.isOk( deserialized.getObjectOfInterest().isBlank(),  'should have blank node OoI after' );
    assert.isOk( deserialized.getMatrix().isBlank(),            'should have blank node Matrix after' );
    assert.equal( deserialized.getObjectOfInterest().getConstraints().length, 1,  'should have a constraint on the OoI after' );
    assert.equal( deserialized.getMatrix().getConstraints().length, 0,            'should have no constraint on the OoI after' );

  });


});


