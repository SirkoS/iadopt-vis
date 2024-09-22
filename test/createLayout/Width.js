import { describe } from 'mocha';
import { assert } from 'chai';

describe.skip( 'property-based testing of width-calculation', function() {

  const variants = {
    'equalWidth': null,
    'proportionalWidth': null,
  };

  before( async function(){

    // load respective width-calculating modules
    for( const key in variants ) {
      variants[ key ] = (await import( `../../src/createLayout/${key}.js` )).calcBoxWidth;
    }

  });




  it( 'should cover the whole width', async function(){

  });

});