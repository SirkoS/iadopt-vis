import { assert, beforeAll, describe, inject, test } from 'vitest';

import extract from '../src/lib/extract.js';
import { Constraint, Entity, Property, Variable } from '../src/model/models.js';



describe( 'extract', () => {

  // get fixtures
  const turtles = inject( 'ttl' );


  test( 'extracts all components of a minimal entry', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\example1.ttl'] );

    // structural validation
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    assert.instanceOf( variable,                        Variable, 'should be instance of Variable' );
    assert.instanceOf( variable.getProperty(),          Property, 'should return a Property' );
    assert.instanceOf( variable.getObjectOfInterest(),  Entity,   'should return an ObjectOfInterest' );
    assert.equal( variable.getConstraints().length,     0, 'should contain no Constraint' );
    assert.equal( variable.getContextObjects().length,  0, 'should contain no ContextObject' );
    assert.equal( variable.getMatrix(),                 null, 'should contain no Matrix' );

    // labels
    assert.equal( variable.getLabel(),                        'Height of a tree',   'should contain the correct label for the Variable' );
    assert.equal( variable.getProperty().getLabel(),          'Height',             'should contain the correct label for the Property' );
    assert.equal( variable.getObjectOfInterest().getLabel(),  'a biological tree',  'should contain the correct label for the ObjectOfInterest' );

  }, 10_000 );



  test( 'extracts all components of an entry with blank node constraints', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\example2.ttl'] );

    // structural validation
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    assert.instanceOf( variable,                        Variable, 'should be instance of Variable' );
    assert.instanceOf( variable.getProperty(),          Property, 'should return a Property' );
    assert.instanceOf( variable.getObjectOfInterest(),  Entity,   'should return an ObjectOfInterest' );
    assert.instanceOf( variable.getMatrix(),            Entity,   'should return a Matrix' );
    assert.equal( variable.getContextObjects().length,  1, 'should contain exactly one ContextObject' );
    assert.isOk( variable.getContextObjects().every( (c) => c instanceof Entity ), 'should only return instances of Entity for context objects' );
    assert.equal( variable.getConstraints().length,     1, 'should contain exactly one Constraint' );
    assert.isOk( variable.getConstraints().every( (c) => c instanceof Constraint ), 'should only return instances of Constraint for constraints' );
    assert.isOk( variable.getConstraints().every( (c) => c.getEntities().length > 0), 'should have at least one constrained Entity for each Constraint' );

    // labels
    assert.equal( variable.getLabel(),                        'concentration of endosulfane sulfate in wet flesh of ostrea edulis',
                  'should contain the correct label for the Variable' );
    assert.equal( variable.getProperty().getLabel(),          'Concentration',
                  'should contain the correct label for the Property' );
    assert.equal( variable.getObjectOfInterest().getLabel(),  'endosulfan sulfate',
                  'should contain the correct label for the ObjectOfInterest' );
    assert.equal( variable.getMatrix().getLabel(),            'flesh',
                  'should contain the correct label for the Matrix' );
    assert.equal( variable.getContextObjects()[0].getLabel(), 'Ostrea edulis',
                  'should contain the correct label for the ContextObject' );
    assert.equal( variable.getConstraints()[0].getLabel(),    'wet',
                  'should contain the correct label for the Constraint' );

  } );



  test( 'extracts all components of an entry with symmetric systems using blank nodes as components', async function(){

    // get entities
    const result = await extract( turtles['test\\_fixture\\example3_asymSys_bnode.ttl'] );

    // structural validation
    const variable = result[0];
    assert.instanceOf( variable,                        Variable, 'should be instance of Variable' );
    assert.instanceOf( variable.getProperty(),          Property, 'should return a Property' );
    assert.instanceOf( variable.getObjectOfInterest(),  Entity,   'should return an ObjectOfInterest' );
    const ooi = variable.getObjectOfInterest();
    assert.isOk( ooi.isSystem() && ooi.isSymmetricSystem(), 'should have the ObjectOfInterest as SymmetricSystem' );
    const comps = ooi.getComponents();
    assert.sameMembers( Object.keys( comps ), [ 'hasPart' ], 'should have only `hasPart` for components of OoI' );
    assert.equal( comps['hasPart'].length, 2, 'should have two components for the OoI' );
    assert.isOk( comps['hasPart'][0] !== comps['hasPart'][1], 'should have two disjoint components' );

    // labels
    assert.sameMembers( comps['hasPart'].map( (c) => c.getLabel() ),
                        ['position of grid cell', 'position of the radial antenna' ],
                        'should have proper labels for both components' );

  } );

});


