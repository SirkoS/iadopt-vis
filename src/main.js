import 'bootstrap/dist/css/bootstrap.css';
import '../css/interface.css';
import '../css/svg.css';
import SvgCss  from '../css/svg.css?raw';


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

      // get SVG container
      const svg = document.querySelector( '#svg' );

      // draw it
      await draw( svg, layout );

      // remember variable IRI
      svg.dataset.iri = content[0].getIri();

      // enable export button
      document.querySelector( '#export' ).classList.remove( 'invisible' );

      // scroll into view
      svg.scrollIntoView( true );

    } catch( e ) {
      console.error( e );
    }

  });
document.querySelector( '#visualize' ).click();

document.querySelector( '#export' )
  .addEventListener( 'click', async (e) => {

    // only trigger on options not the select itself
    if( e.target.tagName.toUpperCase() != 'A' ) {
      return;
    }

    // output depends on type
    switch( e.target.dataset.format ) {

      case 'svg':

        // get iri and derive filename from it
        const svg = document.querySelector( '#svg' );
        const iri = svg.dataset.iri;
        const filename = iri.split( /[/#]/ ).pop() + '.svg';

        // get SVG content and prepare for download
        let content = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svg?.innerHTML;
        content = content
          .replace( '<svg', '<svg xmlns="http://www.w3.org/2000/svg"' )
          .replace( '<defs>', `<defs><style>${SvgCss}</style>`);

        // download
        const svgBlob = new Blob([content], {type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = svgUrl;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        break;

      default: throw Error( 'Unknown export format!' );

    }

  });