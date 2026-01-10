import createLayout from './createLayout.js';
import draw from './draw.js';
import { state as STATE } from './editor/state';
import addActions from './editor/addActions.js';

/**
 * trigger a (re)draw of the Variable visualization
 * @param {Variable?} variable
 */
export default async function triggerRedraw( variable ) {

  // update state, if necessary
  if( variable ) {
    STATE.variable = variable;
  }

  // get currently selected order
  const order = document.querySelector('#order input').value;

  // get SVG container
  const svg = document.querySelector( '#svg' );

  // create the layout
  const layout = await createLayout( STATE.variable, order );

  // draw it
  const comp2layout = await draw( svg, layout );

  // add editor actions to components
  const action2comp = addActions( comp2layout );
  STATE.action2comp = action2comp;

  // remember variable IRI
  svg.dataset.iri = variable.getIri();

  // scroll into view
  svg.scrollIntoView( true );

}
