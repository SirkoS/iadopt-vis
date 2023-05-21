import draw from './draw.js';
import extract from './extract.js';
import createLayout from './createLayout.js';

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

      // draw it
      await draw( document.querySelector( '#svg' ), layout );


    } catch( e ) {
      console.error( e );
    }

  });
