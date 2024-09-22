import parseJSONLD from './model/parseJSONLD.js';
import createLayout from './createLayout.js';
import draw from './draw.js';

import '../css/svg.css';

// detect variable description from parameters
const currentLocation = new URL( window.location );
let data;
switch( true ) {
  case currentLocation.searchParams.has( 'jsonld' ):
    const raw = JSON.parse( decodeURI( currentLocation.searchParams.get( 'jsonld' ) ) );
    data = parseJSONLD( raw );
    break;
  default:
    document.querySelector( 'text' ).innerHTML = 'Missing data!';
}

if( data ) {

  // create the layout
  const layout = await createLayout( data );

  // get SVG container
  const svg = document.querySelector( '#svg' );
  // svg.innerHTML = '';

  // draw it
  draw( svg, layout );
  svg.querySelector( 'svg' ).setAttribute( 'preserveAspectRatio', 'xMidYMin' );

}
