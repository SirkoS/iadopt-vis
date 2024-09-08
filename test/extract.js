import extract from '../src/extract.js';
import VariableSchema from './_schema/variable.schema.json' with {type: 'json'}
import { assert } from 'chai';
import { promises as Fs } from 'fs';

describe( 'extract', function() {

  const fixtures = {};
  before( async function(){

    fixtures.example1 = await Fs.readFile( './test/_fixture/example1.ttl', 'utf8' );
    fixtures.example2 = await Fs.readFile( './test/_fixture/example2.ttl', 'utf8' );

    // increase test timeouts
    this.timeout( 5000 );

  });



  it( 'should extract all components of a minimal entry', async function(){

    // get entities
    const result = await extract( fixtures.example1 );

    // structural validation
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    assert.jsonSchema( variable, VariableSchema, 'should follow the VariableSchema for the Variable' );
    assert.equal( variable.prop.length, 1, 'should contain exactly one property' );
    assert.equal( variable.ooi.length,  1, 'should contain exactly one ObjectOfInterest' );
    assert.equal( variable.constraint.length, 0, 'should contain no Constraint' );
    assert.equal( variable.context.length,    0, 'should contain no ContextObject' );
    assert.equal( variable.matrix.length,     0, 'should contain no Matrix' );

    // labels
    const labels = {
      variable: 'Height of a tree',
      ooi:      'a biological tree',
      prop:     'Height',
    };
    assert.include( variable.label?.map( (el) => el.value ), labels.variable, 'should contain the correct label for "variable"' );
    for( const key of [ 'ooi', 'prop' ] ) {
      const entity = variable[ key ][0];
      assert.include( entity.label?.map( (el) => el.value ), labels[key], `should contain the correct label for "${key}"`);
    }

  } );



  it( 'should extract all components of an entry with blank node constraints', async function(){

    // get entities
    const result = await extract( fixtures.example2 );

    // structural validation
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    assert.jsonSchema( variable, VariableSchema, 'should follow the VariableSchema for the Variable' );
    assert.equal( variable.prop.length,       1, 'should contain exactly one property' );
    assert.equal( variable.ooi.length,        1, 'should contain exactly one ObjectOfInterest' );
    assert.equal( variable.constraint.length, 1, 'should contain exactly one Constraint' );
    assert.equal( variable.context.length,    1, 'should contain exactly one ContextObject' );
    assert.equal( variable.matrix.length,     1, 'should contain exactly one Matrix' );

    // labels
    const labels = {
      variable:   'concentration of endosulfane sulfate in wet flesh of ostrea edulis',
      ooi:        'endosulfan sulfate',
      prop:       'Concentration',
      matrix:     'flesh',
      context:    'Ostrea edulis',
      constraint: 'wet',
    };
    assert.include( variable.label?.map( (el) => el.value ), labels.variable, 'should contain the correct label for "variable"' );
    for( const key of [ 'ooi', 'prop', 'matrix', 'context', 'constraint' ] ) {
      const entity = variable[ key ][0];
      assert.include( entity.label?.map( (el) => el.value ), labels[key], `should contain the correct label for "${key}"`);
    }

  } );

});
