import '../../css/editor.css';
import { Concept, Constraint, Entity, Variable,
  VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS, VALID_SYMMETRIC_SYSTEM_PROPERTIES } from '../model/models';
import triggerRedraw from './triggerRedraw';
import { state as STATE } from './editor/state';
import toTurtle from '../model/toTurtle';

// type selector classes
const TYPE_SELECT_CLASSES = [ 'comp', 'constraint', 'entity', 'ooi', 'matrix', 'context', 'property', 'statmod', 'variable' ];

// shortcuts to form components
const ELEMENTS = {
  input:              null,
  editor:             null,
  editorType:         null,
  editorTypeOptions:  null,
  editorSystem:       null,
  editorSystemProps:  null,
  editorLabel:        null,
  editorIRI:          null,
  editorDesc:         null,
};


/**
 * setup editor components
 */
export default function addEditor() {

  // get all components
  ELEMENTS.input              = document.querySelector( '#input' );
  ELEMENTS.editor             = document.querySelector( '.editor' );
  ELEMENTS.editorType         = document.querySelector( '#editor-type' );
  ELEMENTS.editorTypeOptions  = Array.from( document.querySelectorAll( '#editor-type option' ) )
    .reduce( (all, el) => {
      all[ el.value ] = el;
      return all;
    }, {} );
  ELEMENTS.editorSystem       = document.querySelector( '.editor > form' ).elements['editor-ent-type'];
  ELEMENTS.editorSystemProps  = document.querySelector( '#editor-ent-type-props' );
  ELEMENTS.editorLabel        = document.querySelector( '#editor-label' );
  ELEMENTS.editorIRI          = document.querySelector( '#editor-iri' );
  ELEMENTS.editorDesc         = document.querySelector( '#editor-desc' );

  // add options for asymmetric systems' components
  addAsymSystemProps();

  // add action event listener
  document.querySelector( '#svg' )
    ?.addEventListener( 'click', triggerAction );

  // select type
  ELEMENTS.editorType
    ?.addEventListener( 'input', updateTypeSelector );

  // select system type
  Array.from( ELEMENTS.editorSystem )
    .forEach( (el) => el.addEventListener( 'input', updateSystemPropSelector ) );

  // button: cancel
  document.querySelector( '#editor-cancel' )
    ?.addEventListener( 'click', clearForm );

  document.querySelector( '#editor-save' )
    ?.addEventListener( 'click', saveForm );

}



/**
 * update the UI based on currently selected component type
 */
function updateSystemPropSelector() {
  ELEMENTS.editorSystemProps.classList.toggle(
    'hidden',
    ELEMENTS.editorSystem.value != 'asym'
  );
}



/**
 * update the UI based on currently selected component type
 */
function updateTypeSelector() {

  // determine which class to set
  let newClass;
  switch( ELEMENTS.editorType.value ) {
    case 'ContextObject':
      newClass = 'entity context';
      break;
    case 'Matrix':
      newClass = 'entity matrix';
      break;
    case 'OoI':
      newClass = 'entity ooi';
      break;
    case 'SystemComponent':
      newClass = 'comp';
      break;
    case 'Constraint':
      newClass = 'constraint';
      break;
    case 'Property':
      newClass = 'property';
      break;
    case 'StatisticalModifier':
      newClass = 'statmod';
      break;
    case 'Variable':
      newClass = 'variable';
      break;
  }

  // remove old classes and append new one
  ELEMENTS.editor.classList.remove( ...TYPE_SELECT_CLASSES );
  ELEMENTS.editor.classList.add( ... newClass.split( ' ' ) );

}



/**
 * handle action trigger
 *
 * @param {Event} e event triggered
 * @returns
 */
function triggerAction(e) {

  // shortcut
  const action = e.target;

  // we're only interested in our actions
  if( !action.classList.contains( 'action' ) ) {
    return;
  }

  // get corresponding component
  /** @type {Concept} */
  const comp = STATE.action2comp.get( action );

  // add
  if( action.classList.contains( 'add' ) ) {

    // determine types to enable
    if( comp instanceof Variable ) {

      // by default disable everything
      for( const option of Object.values( ELEMENTS.editorTypeOptions ) ) {
        option.disabled = true;
      }

      // ContextObject is always enabled
      ELEMENTS.editorTypeOptions[ 'ContextObject' ].disabled = false;

      // there can only be one Matrix and StatisticalModifier
      if( !comp.getMatrix() ) {
        ELEMENTS.editorTypeOptions[ 'Matrix' ].disabled = false;
      }
      if( !comp.getStatisticalModifier() ) {
        ELEMENTS.editorTypeOptions[ 'StatisticalModifier' ].disabled = false;
      }

      // enable ContextObject by default
      ELEMENTS.editorType.value = 'ContextObject';

    } else {

      // for all Entities, only Constraints are enabled
      ELEMENTS.editorType.value = 'Constraint';
      ELEMENTS.editorType.disabled = true;

    }
    updateTypeSelector();

    // memorize selection
    STATE.editComp = null;
    STATE.sourceComp = comp;

    // show form
    ELEMENTS.editor.classList.toggle( 'hidden' );
    return;

  }

  // edit
  if( action.classList.contains( 'edit' ) ) {

    // fill form fields
    ELEMENTS.editorLabel.value  = comp.getLabel() ?? '';
    ELEMENTS.editorIRI.value    = comp.getIri() ?? '';
    ELEMENTS.editorDesc.value   = comp.getComment() ?? '';
    ELEMENTS.editorType.value   = comp.getRole();
    if( comp instanceof Entity ) {

      // set the proper system type
      switch( true ) {
        case comp.isSymmetricSystem():
          ELEMENTS.editorSystem.value = 'sym';
          break;
        case comp.isSystem():
          ELEMENTS.editorSystem.value = 'asym';
          // set used asymmetric properties used
          // only use one, as there is no duplicate use of properties (at the moment)
          const prop = comp.getComponentKeys()[0];
          ELEMENTS.editorSystemProps.value = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS.findIndex( (pair) => pair.includes( prop ) );
          break;
        default:
          ELEMENTS.editorSystem.value = 'simple';
      }
      updateSystemPropSelector();
    }
    updateTypeSelector();

    // fix type
    ELEMENTS.editorType.disabled = true;

    // memorize selection
    STATE.editComp = comp;
    STATE.sourceComp = null;

    // show form
    ELEMENTS.editor.classList.toggle( 'hidden' );
    return;

  }


  // delete
  if( action.classList.contains( 'del' ) ) {

    // (recursively) trigger removal of component
    comp.remove();

    // update UI
    triggerRedraw( STATE.variable );
    ELEMENTS.input.value = toTurtle( STATE.variable );

    return;

  }

}



/**
 * save the current content of the form
 */
function saveForm(){

  // add item
  if( STATE.sourceComp && !STATE.editComp ) {

    // type of the added component
    const compType = ELEMENTS.editorType.value;

    // create the new component
    let comp;
    switch( compType ) {
      case 'ContextObject':
      case 'Matrix':
      case 'StatisticalModifier':
        comp = new Entity({
          label:    ELEMENTS.editorLabel.value || undefined,
          iri:      ELEMENTS.editorIRI.value || undefined,
          comment:  ELEMENTS.editorDesc.value || undefined,
        });
        break;
      case 'Constraint':
        comp = new Constraint({
          label:    ELEMENTS.editorLabel.value || undefined,
          iri:      ELEMENTS.editorIRI.value || undefined,
          comment:  ELEMENTS.editorDesc.value || undefined,
        });
        break;
      default:
        throw new Error( `Unexpected type while adding component: ${ELEMENTS.editorType.value}!` );
    }

    // for Entities, check fór Systems
    if( ['ContextObject', 'Matrix' ].includes( compType ) ) {

      // is the component a System?
      const systemType = ELEMENTS.editorSystem.value;
      if( systemType != 'simple' ) {

        // create dummy components
        const comp1 = new Entity({ label: 'Component 1' });
        const comp2 = new Entity({ label: 'Component 2' });

        // add them
        if( systemType == 'sym' ) {

          // symmetric systems
          comp.addComponent( VALID_SYMMETRIC_SYSTEM_PROPERTIES[0], comp1 );
          comp.addComponent( VALID_SYMMETRIC_SYSTEM_PROPERTIES[0], comp2 );

        } else {

          // asymmetric systems
          const props = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS[
            ELEMENTS.editorSystemProps.value
          ];
          comp.addComponent( props[0], comp1 );
          comp.addComponent( props[1], comp2 );

        }
      }

    }

    // link the new component
    switch( compType ) {

      case 'ContextObject':
        STATE.sourceComp.addContextObject( comp );
        break;

      case 'Matrix':
        STATE.sourceComp.setMatrix( comp );
        break;

      case 'StatisticalModifier':
        STATE.sourceComp.setStatisticalModifier( comp );
        break;

      case 'Constraint':
        STATE.sourceComp.getVariable()
          .addConstraint( comp, STATE.sourceComp );
        break;

      default:
        throw new Error( `Unexpected type while adding component: ${ELEMENTS.editorType.value}!` );
    }

  }



  // edit item
  if( !STATE.sourceComp && STATE.editComp ) {

    // store all data
    STATE.editComp.setLabel( '', ELEMENTS.editorLabel.value );
    STATE.editComp.setIri( ELEMENTS.editorIRI.value );
    STATE.editComp.setComment( '', ELEMENTS.editorDesc.value );

    // for systems, update type and properties
    if( ELEMENTS.editor.classList.contains( 'entity' ) ) {
      switch( ELEMENTS.editorSystem.value ) {

        case 'simple':
          // clear out any system components and their constraints
          STATE.editComp.removeComponents();
          break;

        case 'asym':
          if( STATE.editComp.isSystem() ) {
            // was already a system, so adapt properties, if necessary
            const beforeProps = STATE.editComp.getComponentKeys();
            const afterProps = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS[ ELEMENTS.editorSystemProps.value ];
            if( !afterProps.includes( beforeProps[0] ) ) {
              STATE.editComp.changeComponentKeys( afterProps );
            }
          } else {
            // create two dummy components ...
            const comp1 = new Entity({ label: 'Component 1' });
            const comp2 = new Entity({ label: 'Component 2' });
            // ... and add them
            const props = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS[ ELEMENTS.editorSystemProps.value ];
            STATE.editComp.addComponent( props[0], comp1 );
            STATE.editComp.addComponent( props[1], comp2 );
          }
          break;

        case 'sym':
          if( STATE.editComp.isSystem() ) {
            // was already a system
            // we only need to change, if it was asymmetric before
            if( !STATE.editComp.isSymmetricSystem() ) {
              STATE.editComp.changeComponentKeys([
                VALID_SYMMETRIC_SYSTEM_PROPERTIES[0],
                VALID_SYMMETRIC_SYSTEM_PROPERTIES[0]
              ] );
            }
          } else {
            // create two dummy components ...
            const comp1 = new Entity({ label: 'Component 1' });
            const comp2 = new Entity({ label: 'Component 2' });
            // ... and add them
            STATE.editComp.addComponent( VALID_SYMMETRIC_SYSTEM_PROPERTIES[0], comp1 );
            STATE.editComp.addComponent( VALID_SYMMETRIC_SYSTEM_PROPERTIES[0], comp2 );
          }
          break;
        default:
          throw new Error( `Unknown Entity system type "${ELEMENTS.editorSystem.type}".` );

      }
    }

  }

  // close the form
  clearForm();

  // update serialization
  ELEMENTS.input.value = toTurtle( STATE.variable );

  // trigger redraw
  triggerRedraw( STATE.variable );

}



/**
 * clear all form inputs and close the editor
 */
function clearForm() {

  // clear state
  STATE.editComp = null;
  STATE.sourceComp = null;

  // clean inputs
  ELEMENTS.editorLabel.value = '';
  ELEMENTS.editorIRI.value = '';
  ELEMENTS.editorDesc.value = '';
  ELEMENTS.editorSystem.value = 'simple';
  ELEMENTS.editorSystemProps.value = 0;
  ELEMENTS.editorType.disabled = false;

  // close editor
  ELEMENTS.editor.classList.toggle( 'hidden' );

}


/**
 * add options to select asymmetric systems' properties
 */
function addAsymSystemProps() {

  const options = document.createDocumentFragment();

  for( let i=0; i<VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS.length; i++ ) {

    const pair = VALID_ASYMMETRIC_SYSTEM_PROPERTY_PAIRS[ i ];

    const el = document.createElement( 'option' );
    el.value = i;
    el.textContent = pair.join( ' / ' );

    options.appendChild( el );

  }

  ELEMENTS.editorSystemProps.appendChild( options );

}
