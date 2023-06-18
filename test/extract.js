import extract from '../src/extract.js';
import VariableSchema from './_schema/variable.schema.json' assert { type: "json" };
import { assert } from 'chai';
import { promises as Fs } from 'fs';

describe( 'extract', function() {

  const fixtures = {};
  before( async function(){
    fixtures.example1 = await Fs.readFile( './test/_fixture/example1.ttl', 'utf8' );
  });

  it( 'should extract all components of a minimal entry', async function(){

    // get entities
    const result = await extract( fixtures.example1 );
    // console.log( JSON.stringify( result, null, 2 ) );

    // structural validation
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    assert.jsonSchema( variable, VariableSchema, 'should follow the VariableSchema for the Variable' );
    assert.equal( variable.prop.length, 1, 'should contain exactly one property' );
    assert.equal( variable.ooi.length,  1, 'should contain exactly one ObjectOfInterest' );
    assert.equal( variable.constraint.length, 0, 'should contain no constraint' );
    assert.equal( variable.context.length,    0, 'should contain no constraint' );
    assert.equal( variable.matrix.length,     0, 'should contain no constraint' );

    // labels
    const labels = {
      variable: 'Height of a tree',
      ooi:      'a biological tree',
      prop:     'height',
    };
    assert.include( variable.label?.map( (el) => el.value ), labels.variable, 'should contain the correct label for "variable"' );
    for( const key of [ 'ooi', 'prop' ] ) {
      const entity = variable[ key ][0];
      assert.include( entity.label?.map( (el) => el.value ), labels[key], `should contain the correct label for "${key}"`);
    }

    // prefixed IRIs
    assert.equal( )
  } );

});