import 'bootstrap/dist/css/bootstrap.css';
import '../css/interface.css';
import '../css/svg.css';

import draw from './draw.js';
import extract from './extract.js';
import createLayout from './createLayout.js';

import * as bootstrap from 'bootstrap';

document.querySelector( '#visualize' )
  .addEventListener( 'click', async () => {

    try {

      // get input
      const raw = document.querySelector( '#input' ).value;

      // extract components to visualize
      const content = await extract( raw );

      // create the layout
      const layout = await createLayout( content[0] );
      // document.querySelector( '#dev' ).innerHTML = JSON.stringify( content, null, 2 );

      // get SVG container
      const svg = document.querySelector( '#svg' );

      // draw it
      await draw( svg, layout );

      // enable export button
      document.querySelector( '#export' ).classList.remove( 'invisible' );

      // scroll into view
      svg.scrollIntoView( true );


    } catch( e ) {
      console.error( e );
    }

  });

document.querySelector( '#visualize' ).click();