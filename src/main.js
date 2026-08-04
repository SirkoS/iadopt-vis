import 'bootstrap/dist/css/bootstrap.css';
import '../css/interface.css';
import '../css/svg.css';
import '../css/error.css';
import '../css/print.css';

import addEditor from './lib/addEditor.js';
import triggerRedraw from './lib/triggerRedraw.js';
import extract from './lib/extract.js';
import { getSVGBlob, getPNGBlob, getTurtleBlob, getJsonld } from './lib/export.js';

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

        case 'jsonld':
          blob = await getJsonld();
          ext = 'jsonld';
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


/* XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX ORDER XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

document.querySelector( '#order kbd' )
  .addEventListener( 'click', () => {
    document.querySelector( '.orderDialog' ).classList.remove( 'hidden' );
  });

document.querySelector( '.orderDialog button' )
  .addEventListener( 'click', () => {

    // update selection
    const order = Array.from( document.querySelectorAll( '.orderDialog .dropzone .concept' ) )
      .map( (el) => el.dataset.id )
      .join('')
      .toUpperCase();
    document.querySelector('#order kbd').innerHTML = order;
    document.querySelector('#order input').value = order;

    // trigger redraw
    document.querySelector( '#visualize' ).click();

    // close dialog
    document.querySelector( '.orderDialog' ).classList.add( 'hidden' );
  });

// drag & drop
let draggedItem;
for( const el of document.querySelectorAll( '.orderDialog .concept' ) ) {
  el.addEventListener( 'dragstart', dragStart );
  el.addEventListener( 'dragover',  dragOver );
  el.addEventListener( 'dragend',   dragEnd );
}


function dragEnd(e) {
  // if( e.target.parentNode == draggedItem.parentNode ) {
  //   console.log( e.target, draggedItem );
  //   e.target.parentNode.insertBefore( draggedItem, e.target );
  // }
  draggedItem = null;
}

function dragOver(e) {
  if (isBefore(draggedItem, e.target)) {
    e.target.parentNode.insertBefore(draggedItem, e.target);
  } else {
    e.target.parentNode.insertBefore(draggedItem, e.target.nextSibling);
  }
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', null);
  draggedItem = e.target;
}

function isBefore(el1, el2) {
  let cur;
  if (el2.parentNode === el1.parentNode) {
    for (cur = el1.previousSibling; cur; cur = cur.previousSibling) {
      if (cur === el2) return true;
    }
  }
  return false;
}