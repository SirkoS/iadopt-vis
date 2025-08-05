import { createElement } from '../draw.js';

// symbols to use for actiosn
const ACTION_SYMBOLS = {
  'add':  'Add',
  'edit': 'Edit',
  'del':  'Del',
};

/**
 * add actions to all SVG components
 *
 * @param   {Map<HTMLElement, Object} comp2layout   Variable description
 * @returns {Map<HTMLElement, Concept} mapping of actions to their respective component
 */
export default function addActions( comp2layout ) {

  // collect mapping
  const action2comp = new Map();

  for( const [ box, layout ] of comp2layout.entries() ) {

    // base container
    const container = createElement( 'g', {
      class: 'menu',
    });

    // add overlay
    container.appendChild( createElement( 'rect', {
      class: 'overlay',
      x: layout.x,
      y: layout.y,
      width:  layout.width,
      height: layout.height
    } ));

    // which actions to add?
    const actions = [];
    if( ![ 'Constraint' ].includes( layout.comp.getRole() ) ) {
      actions.push( 'add' );
    }
    actions.push( 'edit' );
    if( ![ 'Variable', 'OoI', 'Property', 'SystemComponent' ].includes( layout.comp.getRole() ) ) {
      actions.push( 'del' );
    }

    // calc width and coordinates for action container
    const width = Math.max( layout.width, 160 );
    const x = width > 160
                ? layout.x
                : layout.x - 0.5 * (160 - layout.width);

    // foreignObject as an action container
    const actionContainer = createElement( 'foreignObject', {
      class: 'overlay',
      x: x,
      y: layout.y,
      width:  width,
      height: layout.height
    } );
    container.appendChild( actionContainer );
    const btnGroup = document.createElement( 'div' );
    btnGroup.classList.add( 'btn-group' );
    btnGroup.setAttribute( 'role', 'group' );
    btnGroup.setAttribute( 'aria-label', 'component actions' );
    actionContainer.appendChild( btnGroup );

    // add action buttons
    for( const actionType of actions ) {
      const action = document.createElement( 'button' );
      action.className = 'action btn btn-primary ' + actionType;
      action.textContent = ACTION_SYMBOLS[ actionType ];
      btnGroup.appendChild( action );
      action2comp.set( action, layout.comp );
    }

    // add to box
    box.appendChild( container );

  }

  return action2comp;

}
