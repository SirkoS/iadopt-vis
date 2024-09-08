import parse from '../../src/model/parseJSONLD.js';
import { assert } from 'chai';
import { promises as Fs } from 'fs';
import { Constraint, Entity, Variable } from '../../src/model/models.js';

describe.only( 'model.parseJSONLD', function() {

  const fixtures = {};

  before( async function(){

    fixtures.full = JSON.parse( await Fs.readFile( './test/_fixture/full.jsonld', 'utf8' ) );

    // increase test timeouts
    this.timeout( 5000 );

  });



  it( 'should parse a valid JSON-LD object into internal model', async function(){

    // get entities
    const result = parse( fixtures.full );

    assert.instanceOf( result, Variable, 'should return an instance of Variable' );
    assert.equal( result.getLabel(), 'concentration of endosulfane sulfate in wet flesh of ostrea edulis', 'should return the correct label' );
    assert.instanceOf( result.getProperty(), Entity, 'should return an Entity for property' );
    assert.instanceOf( result.getObjectOfInterest(), Entity, 'should return an Entity for ObjectOfInterest' );
    assert.instanceOf( result.getMatrix(), Entity, 'should return an Entity for Matrix' );
    const ctx = result.getContextObjects();
    assert.instanceOf( ctx, Array, 'should return an Array for ContextObject' );
    for( const c of ctx ) {
      assert.instanceOf( c, Entity, 'should return an Entity for ContextObject' );
    }
    const constraints = result.getConstraints();
    assert.instanceOf( constraints, Array, 'should return an Array for Constraints' );
    for( const c of constraints ) {
      assert.instanceOf( c, Constraint, 'should return only Constraint for Constraints' );
    }

  } );


});
