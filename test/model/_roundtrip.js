import toJSONLD from '../../src/model/toJSONLD.js';
import parse from '../../src/model/parseJSONLD.js';
import { assert } from 'chai';
import { promises as Fs } from 'fs';


describe( 'roundtrip (parse and serialize JSON-LD)', function() {

  // increase test timeouts
  this.timeout( 5000 );

  // load fixtures
  const fixtures = {};

  before( async function(){

    fixtures.jsonLD = {
      Variable_System_Constraint: JSON.parse( await Fs.readFile( './test/_fixture/Variable_System_Constraint.jsonld', 'utf8' ) ),
    };

  });



  it( 'should have no effect on the output', async function(){

    // serialize
    const object = parse( fixtures.jsonLD.Variable_System_Constraint );
    const json = toJSONLD( object );

    // assert
    assert.deepEqual(
      json,
      fixtures.jsonLD.Variable_System_Constraint,
      'should result in the same structure'
    );

  } );


});
