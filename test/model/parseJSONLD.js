import parse from '../../src/model/parseJSONLD.js';
import { assert } from 'chai';
import { promises as Fs } from 'fs';
import { Constraint, Entity, Property, Variable } from '../../src/model/models.js';

describe( 'model.parseJSONLD', function() {

  // increase test timeouts
  this.timeout( 5000 );

  // load fixtures
  const fixtures = {};

  before( async function(){

    fixtures.full = JSON.parse( await Fs.readFile( './test/_fixture/full.jsonld', 'utf8' ) );

  });



  it( 'should parse a valid JSON-LD object into internal model', async function(){

    // get entities
    const result = parse( fixtures.full );

    assert.instanceOf( result, Variable, 'should return an instance of Variable' );
    assert.instanceOf( result.getProperty(), Property, 'should return an Entity for property' );
    assert.instanceOf( result.getObjectOfInterest(), Entity, 'should return an Entity for ObjectOfInterest' );
    assert.instanceOf( result.getMatrix(), Entity, 'should return an Entity for Matrix' );
    const ctx = result.getContextObjects();
    assert.instanceOf( ctx, Array, 'should return an Array for ContextObject' );
    assert.isOk( ctx.every( (c) => c instanceof Entity ), 'should only return instances of Entity for context objects' );
    const constraints = result.getConstraints();
    assert.instanceOf( constraints, Array, 'should return an Array for Constraints' );
    assert.isOk( constraints.every( (c) => c instanceof Constraint ), 'should only return instances of Constraint for constraints' );
    assert.isOk( constraints.every( (c) => c.getEntities().length > 0), 'should have at least one constrained Entity for each Constraint' );

    // labels
    assert.equal( result.getLabel(), 'concentration of endosulfane sulfate in wet flesh of ostrea edulis', 'should return the correct label' );


  } );


});
