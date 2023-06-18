import { describe } from 'mocha';
import splitText from '../../src/createLayout/splitText.js';
import { assert } from 'chai';

// manually selected testcases
const SELECTED_TESTCASES = [
  {
    desc:  'simple',
    lines: 2,
    in:   'abc def',
    out:  [ 'abc', 'def' ],
  },
  {
    desc:  'excessive length of one token',
    lines: 2,
    in:   'abcdefghijk l',
    out:  [ 'abcdefghijk', 'l' ],
  },
  {
    desc:  'can not be split',
    lines: 2,
    in:   'abc',
    out:  [ 'abc' ],
  },
  {
    desc:  'can only be split in fewer lines',
    lines: 3,
    in:   'abc def',
    out:  [ 'abc', 'def' ],
  },
];


describe( 'createLayout/splitText', function() {

  describe( 'basic tests', function(){

    // magic number, so all testcases have an integer solution
    const inputLength = 2*2*2*3*3*5*7;

    // create simple testcase that works for splits from 1 to 10 lines
    const input = (new Array( inputLength )).fill( 'a' ).join( ' ' );

    for( let i=1; i<11; i++ ) {

      it( `should split into ${i} line(s)`, function(){

        // run
        const result = splitText( input, i );

        // check
        assert.isArray( result, 'should return an array' );
        assert.equal( result.length, i, 'should have to correct number of lines' );
        const targetLine = (new Array( inputLength / i )).fill( 'a' ).join( ' ' );
        for( const [ index, line ] of Object.entries( result ) ) {
          // assert.equal( line.length, targetLine.length, 'should contain a text of correct length in each line' );
          assert.equal( line, targetLine, `should contain the correct text in line #${index}` );
        }

      });

    }

  } );


  describe( 'selected cases', function() {

    for( const [ index, testcase ] of Object.entries( SELECTED_TESTCASES ) ) {
      it( `should split selected testcase #${index} into ${testcase.lines} lines ("${testcase.desc}")`, function(){

        // run
        const result = splitText( testcase.in, testcase.lines );

        // check
        assert.isArray( result, 'should return an array' );
        assert.equal( result.length, testcase.out.length, 'should have to correct number of lines' );
        assert.sameOrderedMembers( result, testcase.out, 'should contain the correct splitting into lines' );

      } );
    }

  });

});
