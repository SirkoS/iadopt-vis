/**
 * display an error on the UI
 *
 * @param {string} target   where to render
 * @param {Error} error     error object itself
 * @param {string} target   source of the error in architecture (Parsing, Rendering, ...)
 * @param {string} rdf      RDF code that failed
 */
export function showError( target, error, source, rdf ) {

  // delete previous content
  const cont = document.querySelector( target );
  cont.innerHTML = '';

  // create frame
  const box = document.createElement( 'div' );
  box.classList.add( 'error' );
  // https://getbootstrap.com/docs/5.0/components/alerts/
  box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" role="img" aria-label="Warning:">
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>`;
  const head = document.createElement( 'div' );
  head.classList.add( 'head' );
  box.appendChild( head );
  const body = document.createElement( 'div' );
  body.classList.add( 'body' );
  box.appendChild( body );

  // add content
  head.innerHTML = `Error during ${source}` ;
  if( source.toLowerCase() != 'rendering' ) {
    body.innerHTML = error.message;
  }

  // add link, if this is within our control
  if( source.toLowerCase() == 'rendering' ) {
    const RDFContent = encodeURIComponent( rdf );
    const errorContent = encodeURIComponent( error.message );
    const link = document.createElement( 'div' );
    link.classList.add( 'link' );
    link.innerHTML = `Please report the bug <a href="https://github.com/SirkoS/iadopt-vis/issues/new?template=bug_remote.yaml&src=${RDFContent}&what-happened=${errorContent}" target="blank">here</a>.`;
    body.appendChild( link );
  }

  // render
  cont.appendChild( box );

  // notify parent window
  const dims = box.getClientRects();
  const margin = box.computedStyleMap
                  ? box.computedStyleMap().get( 'margin-left' ).value
                  : +( window.getComputedStyle( box ).marginLeft?.replace( /[^0-9]/gi, '' ) ?? 0);
  const message = {
    height: dims[0].height + 2*margin,
    width: dims[0].width + 2*margin,
  };
  window.top.postMessage( message, {
    targetOrigin: '*',
  } );

}
