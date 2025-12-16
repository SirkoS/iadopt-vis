import { assert, describe, test } from 'vitest';

import { layoutText } from '../src/lib/createLayout.js';

describe( 'createLayout.layoutText', async () => {

  test( 'creates text layout for "Constraint" when there is not enough space', async () => {

    // create layout
    const layout = layoutText({
      'boxCenter':  187.85714285714283,
      'boxWidth':   88.57142857142857,
      'startY':     520,
      'text':       'Constraint',
    });

    assert.isArray( layout, 'returns an array of text items' );
    assert.equal( layout.length, 1, 'returns exactly one text element' );
    assert.equal( layout[0].text, 'Constraint', 'returns the initial text' );

  } );

});
