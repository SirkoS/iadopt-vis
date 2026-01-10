import parseJSONLD from './model/parseJSONLD.js';
import extract from './lib/extract.js';
import createLayout from './lib/createLayout.js';
import draw from './lib/draw.js';
import { showError } from './ui/showError.js';

import '../css/svg.css';
import '../css/error.css';

(async function(){

  // detect variable description from parameters
  const currentLocation = new URL( window.location );
  let data, raw;
  try {
    switch( true ) {
      case currentLocation.searchParams.has( 'jsonld' ):
        raw = JSON.parse( decodeURI( currentLocation.searchParams.get( 'jsonld' ) ) );
        data = parseJSONLD( raw );
        break;
      case currentLocation.searchParams.has( 'ttl' ):
        raw = decodeURI( currentLocation.searchParams.get( 'ttl' ) );
        data = await extract( raw );
        data = data[0];
        break;
      default:
        document.querySelector( 'text' ).innerHTML = 'Missing data!';
    }
  } catch( e ) {
    showError( '#svg', e, 'Parsing', raw );
    return;
  }

  if( data ) {

    // check for an order set
    const order = currentLocation.searchParams.has( 'order' ) && currentLocation.searchParams.get( 'order' );

    // create the layout
    const layout = order ? await createLayout( data, order ) : await createLayout( data );

    // get SVG container
    const container = document.querySelector( '#svg' );
    // svg.innerHTML = '';

    // draw it
    draw( container, layout );
    const svg = container.querySelector( 'svg' );
    svg.setAttribute( 'preserveAspectRatio', 'xMidYMin' );

    // update host document about dimensions
    const dims = svg.getAttribute('viewBox').split( ' ' );
    window.top.postMessage({
      height: dims[3],
      width: dims[2],
    }, {
      targetOrigin: '*',
    });

  }

})().catch( (e) => console.error( e ) );

