import toJSONLD from '../../src/model/toJSONLD.js';
import { assert } from 'chai';
import { promises as Fs } from 'fs';
import { Constraint, Entity, Property, Variable } from '../../src/model/models.js';
import createVariable from '../_fixture/Variable_System_Constraint.js';


describe( 'model.toJSONLD', function() {

  // increase test timeouts
  this.timeout( 5000 );

  // load fixtures
  const fixtures = {};

  before( async function(){

    fixtures.jsonLD = {
      Variable_System_Constraint: JSON.parse( await Fs.readFile( './test/_fixture/Variable_System_Constraint.jsonld', 'utf8' ) ),
    };
    fixtures.object = {
      Variable_System_Constraint: createVariable({ Constraint, Entity, Property, Variable }),
    };

  });



  it( 'should serialize a Variable instance into a valid JSON-LD object', async function(){

    // serialize
    const result = toJSONLD( fixtures.object.Variable_System_Constraint );

    // assert
    assert.deepEqual(
      result,
      fixtures.jsonLD.Variable_System_Constraint,
      'should serialize a Variable with all components'
    );

  } );


});
