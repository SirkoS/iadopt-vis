import 'bootstrap/dist/css/bootstrap.css';
import '../css/interface.css';
import '../css/svg.css';
import '../css/error.css';
import '../css/print.css';

import addEditor from './lib/addEditor.js';
import triggerRedraw from './lib/triggerRedraw.js';
import extract from './lib/extract.js';
import { getSVGBlob, getPNGBlob, getTurtleBlob } from './lib/export.js';

import { showError } from './ui/showError.js';

import * as bootstrap from 'bootstrap';

document.querySelector( '#visualize' )
  .addEventListener( 'click', async () => {

    // get input
    const raw = document.querySelector( '#input' ).value;

    try {

      // extract components to visualize
      let content;
      try {
        content = await extract( raw );
      } catch( e ) {
        console.error( e );
        showError( '#svg', e, 'Parsing', raw );
        return;
      }

      // trigger a redraw
      triggerRedraw( content[0] );

      // add editor
      await addEditor();

      // enable export button
      document.querySelector( '#export' ).classList.remove( 'invisible' );

    } catch( e ) {
      console.error( e );
      showError( '#svg', e, 'Rendering', raw );
    }

  });
document.querySelector( '#visualize' ).click();

document.querySelector( '#export' )
  .addEventListener( 'click', async (e) => {
    // only trigger on options not the select itself
    if( e.target.tagName.toUpperCase() != 'A' ) {
      return;
    }

    try {

      // output depends on type
      let blob, ext;
      switch( e.target.dataset.format ) {

        case 'svg':
          blob = getSVGBlob();
          ext = 'svg';
          break;

        case 'png':
          blob = await getPNGBlob();
          ext = 'png';
          break;

        case 'ttl':
          blob = await getTurtleBlob();
          ext = 'ttl';
          break;

        default: throw Error( 'Unknown export format!' );

      }

      // get iri and derive filename from it
      const svg = document.querySelector( '#svg' );
      const iri = svg.dataset.iri;
      const filename = iri.split( /[/#]/ ).pop() + '.' + ext;

      // trigger download
      const dlURL = URL.createObjectURL( blob );
      const downloadLink = document.createElement('a');
      downloadLink.href = dlURL;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

    } catch(e) {
      console.error(e);
    }





  });