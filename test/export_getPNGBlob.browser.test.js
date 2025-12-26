import { assert, describe, inject, test } from 'vitest';
import { server } from '@vitest/browser/context';

import extract from '../src/lib/extract.js';
import { getPNGBlob } from '../src/lib/export.js';
import triggerRedraw from '../src/lib/triggerRedraw.js';



describe( 'extract.getPNGBlob', async () => {

  // get fixtures
  const turtles = inject( 'ttl' );
  const html = await server.commands.readFile( 'index.html' );


  test.skip( 'should export PNG without issues', async function(){
    // skipped as playwright keeps on throwing some error without a message

    // render UI
    const container = document.createElement( 'div' );
    container.innerHTML = html;
    document.body.append( container );

    // get entities
    const result = await extract( turtles['test\\_fixture\\issue007.ttl'] );
    assert.isArray( result, 'should return an array' );
    assert.equal( result.length, 1, 'should contain a single Variable' );
    const variable = result[0];
    // render
    triggerRedraw(variable);

    // export to PNG
    await getPNGBlob();

    // validation

  }, 10_000 );

});


