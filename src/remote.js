import parseJSONLD from './model/parseJSONLD.js';
import extract from './extract.js';
import createLayout from './createLayout.js';
import draw from './draw.js';

import '../css/svg.css';

(async function(){

  // detect variable description from parameters
  const currentLocation = new URL( window.location );
  let data, raw;
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

  if( data ) {

    // create the layout
    const layout = await createLayout( data );

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

