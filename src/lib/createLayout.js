import Cfg from '../config.js';
import calcBoxWidth from './createLayout/equalWidth.js';
import getTextDims from './createLayout/getTextDims.js';
import splitText from './createLayout/splitText.js';
import {
  Concept, Constraint, Entity, Property, Variable,
} from '../model/models.js';

// labels for arrows connecting Variable and the direct properties
const ARROW_LABELS = {
  'Property':             'hasProperty',
  'Matrix':               'hasMatrix',
  'ContextObject':        'hasContextObject',
  'OoI':                  'hasObjectOfInterest',
  'StatisticalModifier':  'hasStatisticalModifier',
  'constrains':           'constrains',
  'hasConstraint':        'hasConstraint',
};


/**
 * @typedef Layout
 * @property {Array.<Arrow>}  arrows
 * @property {Array.<Box>}    boxes
 */

/**
 * @typedef Text
 *
 * @property {string}         className  CSS classes to be attached
 * @property {string}         [link]     URL to be linked to
 * @property {string}         text       text content
 * @property {number}         x          horizontal center
 * @property {number}         y          vertical center
 */

/**
 * @typedef Box one box to be rendered, representing some component of the Variable
 *
 * @property {string}         className       CSS classes to be attached
 * @property {Concept}        comp            corresponding component
 * @property {number}         descSeparator   y-coordinate of separator between title and description
 * @property {number}         x               left coordinate of box
 * @property {number}         y               upper coordinate of box
 * @property {number}         width           width of box
 * @property {number}         height          height of box
 * @property {Array.<Text>}   texts           text elements of the box
 */

/**
 * @typedef Arrow one arrow to be rendered
 *
 * @property {boolean}        hideHead        hide arrow head
 * @property {boolean}        rotate          rotate arrow label by 90 degree
 * @property {string}         [text]          label of arrow
 * @property {number}         x               left coordinate of label
 * @property {number}         y               upper coordinate of label
 * @property {string}         type            property this arrow belongs to
 * @property {Array<object>}  path            path description
 * @property {number}         path.x          x-coordinate of a point in the path
 * @property {number}         path.y          y-coordinate of a point in the path
 */


/**
 * do the layout for a single Variable
 * @param   {Variable} data     Variable description
 * @param   {string}   order    order of components
 * @returns {Layout}          computed layout
 */
export default function createLayout( data, order = 'pomcs' ) {

  // prep result
  const result = {
    arrows: [],
    boxes:  []
  };

  let box, arrow;

  // memorize the starting y-coordinate for each box
  let startY = Cfg.layout.margin;

  // the Variable itself
  const variableBox = getBox( 'Variable', data, startY );
  result.boxes.push( variableBox );
  startY += variableBox.height;

  // second row of elements
  startY += Cfg.layout.entity.vertMargin;

  // get elements to show in second row
  const components = getComponents( data, order );

  // calculate widths for each box
  calcBoxWidth( components );

  // entries for all components
  for( const obj of components ) {

    // add the box
    const type = obj instanceof Property
                  ? 'Property'
                  : obj.getRole() == 'StatisticalModifier' ? 'Stat. Mod.'
                    : obj.isSystem() ? 'System' : 'Entity';
    box = getBox( type, obj, startY );
    result.boxes.push( box );

    // add the corresponding arrow
    arrow = {
      text: ARROW_LABELS[ obj.getRole() ],
      path: [
        { x: box.x + 0.5 * box.width, y: variableBox.y + variableBox.height },
        { x: box.x + 0.5 * box.width, y: box.y - 6 },
      ],
      x:    box.x + 0.5 * box.width,
      y:    variableBox.y + variableBox.height + 0.5 * (box.y - variableBox.y - variableBox.height),
      dim:  getTextDims( ARROW_LABELS[ obj.getRole() ] ),
      type: obj.getRole(),
    };
    result.arrows.push( arrow );

    // account for systems
    if( obj.isSystem() ) {

      // create boxes
      const sysComponents = obj.getComponents();
      const keys = Object.keys( sysComponents );
      for( const key of keys ) {

        for( const sysComp of sysComponents[ key ] ) {

          // determine where to start vertically
          const startY = obj.startY
                          ?? obj.box.y + obj.box.height
                             + Cfg.layout.entity.vertMarginMedium;

          // add the box
          box = getBox( 'Entity', sysComp, startY, obj );
          result.boxes.push( box );

          // add the corresponding arrow
          const label = key.split( '/' ).pop();
          arrow = {
            text: label,
            path: [
              { x: box.x + 0.5 * box.width, y: obj.box.y + obj.box.height },
              { x: box.x + 0.5 * box.width, y: box.y - 6 },
            ],
            x:    box.x + 0.5 * box.width,
            y:    obj.box.y + obj.box.height + 0.5 * (box.y - obj.box.y - obj.box.height) - 3,
            dim:  getTextDims( label ),
            type: 'system component',
          };
          result.arrows.push( arrow );
        }

      }
    }

  }

  // add constraints
  for( const obj of components ) {
    layoutConstraints( obj, result );
  }

  // add hasConstraint arrows, if needed
  for( const parent of components ) {

    // skip for entities without constraints
    const constraints = parent.getConstraints();
    if( !constraints.length ) {
      continue;
    }

    // add arrow to first constraint (includes label)
    const x = parent.box.x + parent.box.width + 0.5 * Cfg.layout.entity.horMargin;
    let constraint = constraints[0];
    arrow = {
      text: ARROW_LABELS.hasConstraint,
      path: [
        { x: x, y: variableBox.y + variableBox.height },
        { x: x, y: constraint.box.y + 0.5 * constraint.box.height },
        { x: x - 0.5 * Cfg.layout.entity.horMargin + 6, y: constraint.box.y + 0.5 * constraint.box.height },
      ],
      x:    x,
      y:    variableBox.y + variableBox.height + 0.5 * (parent.box.y - variableBox.y - variableBox.height) + 20,
      dim:  getTextDims( ARROW_LABELS.hasConstraint ),
      type: 'hasConstraint',
      rotate: true,
    };
    result.arrows.push( arrow );

    // arrows for all other constraints
    for( let i=1; i<constraints.length; i++ ) {

      // shortcuts
      const cur  = constraints[ i ],
            prev = constraints[ i - 1 ];

      // add arrow
      arrow = {
        path: [
          { x: x, y: prev.box.y + 0.5 * prev.box.height },
          { x: x, y: cur.box.y  + 0.5 * cur.box.height },
          { x: x - 0.5 * Cfg.layout.entity.horMargin + 6, y: cur.box.y + 0.5 * cur.box.height },
        ],
        x:    x,
        y:    variableBox.y + variableBox.height + 0.5 * (parent.box.y - variableBox.y - variableBox.height) + 20,
        type: 'hasConstraint',
      };
      result.arrows.push( arrow );
    }

  }

  // add hasConstraint arrows for _systems_, if needed
  for( const system of components.filter( (c) => c.isSystem() ) ) {

    // get all constrains
    /** @type {Array.<Constraint>} */
    const constraints = Object.values( system.getComponents() )
      .flatMap( (s) => s )
      .flatMap( (s) => s.getConstraints() );

    // skip for systems without constraints
    if( !constraints.length ) {
      continue;
    }

    // get overall left-most constraint
    const leftConstraint = constraints.reduce( (left, cur) => (left.box.x < cur.box.x ? left : cur), constraints[0] );
    // get overall bottom-most constraint
    const botConstraint = constraints.reduce( (bot, cur) => (bot.box.y > cur.box.y ? bot : cur), constraints[0] );

    // add arrow start as a frame (includes label)
    const x = system.box.x + system.box.width + 0.5 * Cfg.layout.entity.horMargin;
    const maxY = botConstraint.box.y + botConstraint.box.height + Cfg.layout.entity.vertMarginTiny;
    const sysHasConstraints = system.getConstraints().length > 0;
    arrow = {
      text: sysHasConstraints ? undefined : ARROW_LABELS.hasConstraint,
      path: [
        {
          x: x,
          y: variableBox.y + variableBox.height,
        }, {
          x: x,
          y: maxY,
        }, {
          x: leftConstraint.box.x + 0.5 * leftConstraint.box.width,
          y: maxY,
        },
      ],
      x:    x,
      y:    variableBox.y + variableBox.height + 0.5 * (system.box.y - variableBox.y - variableBox.height) + 20,
      dim:  getTextDims( ARROW_LABELS.hasConstraint ),
      type: 'hasConstraint',
      rotate: true,
      hideHead: true,
    };
    result.arrows.push( arrow );

    // arrows to the bottom most constraint per system component
    for( const sysComponent of Object.values( system.getComponents() ).flatMap( (c) => c ) ) {

      // get all constraints
      const constraints = sysComponent.getConstraints();

      // skip those without constraints
      if( constraints.length < 1 ){
        continue;
      }

      // get bottom-most constraint
      const botConstraint = constraints.reduce( (bot, cur) => (bot.box.y > cur.box.y ? bot : cur), constraints[0] );

      // add the missing arrow bit
      arrow = {
        path: [
          {
            x: botConstraint.box.x + 0.5 * botConstraint.box.width,
            y: maxY,
          }, {

            x: botConstraint.box.x + 0.5 * botConstraint.box.width,
            y: botConstraint.box.y + botConstraint.box.height + 6,
          },
        ],
        type: 'hasConstraint',
      };
      result.arrows.push( arrow );

    }

  }

  return result;

}


/**
 * gather the full layout-data for a box
 * @param   {string}    type        type of the box
 * @param   {Concept}   data        description
 * @param   {number}    initialY    starting y-coordinate for this level of boxes
 * @param   {Concept}   [parent]    parent; used for SystemComponents
 * @returns {object}                layout data
 */
function getBox( type, data, initialY, parent ) {

  // center of the box as point of alignment for texts
  // default is based on entire width of visualization
  const boxCenter = (data.x ?? Cfg.layout.margin)
    + 0.5 * (data.width ?? (Cfg.layout.width - 2 * Cfg.layout.margin));

  // width of the box is either given or uses all available space
  const boxWidth = data.width ?? (Cfg.layout.width - 2 * Cfg.layout.margin);

  // prepare description texts
  const lines = [];
  let startY = initialY + 1 * Cfg.layout.entity.header.height;

  // append label as header
  const headerLines = [];
  if( !data.isBlank() || data.getLabel( true ) ) {

    // add title
    headerLines.push(
      ... layoutText({ text: data.getLabel(), startY, boxWidth, boxCenter })
        .map( (line) => ({
          ... line,
          className: 'title',
          link: data.isBlank() || data.getShortIri() ? undefined : data.getIri(),
        }))
    );

    // account for space
    startY = headerLines[ headerLines.length - 1 ].y + Cfg.layout.lineHeight;

  }

  // append separator between header and remaining description
  let descSeparator = startY;
  startY += Cfg.layout.lineHeight;

  // append prefixed IRI, if available
  if( data.getShortIri() ) {
    lines.push({
      x: boxCenter,
      y: startY,
      text:       data.isBlank() ? '' : data.getShortIri(),
      className:  'desc',
      link:       data.getIri(),
    });
    startY += Cfg.layout.lineHeight;
  }

  // append description, if available
  if( data.getComment() ) {
    lines.push( ... layoutText({ text: data.getComment(), startY, boxWidth, boxCenter }) );
    startY = lines[ lines.length - 1 ].y + Cfg.layout.lineHeight;
  }

  // if there's no description, remove the space again
  if( lines.length < 1 ) {
    startY -= 0.5 * Cfg.layout.entity.header.height;
  }

  // determine additional classnames
  const className = parent
    ? parent.getRole().toLocaleLowerCase()
    : data.getRole().toLocaleLowerCase();

  // base entry for the box
  const box = {
    comp:           data,
    x:              data.x ?? Cfg.layout.margin,
    width:          boxWidth,
    y:              initialY,
    height:         startY - initialY,
    descSeparator:  descSeparator,
    className:      `${type.toLowerCase().replace( /[^a-z]*/gi, '' )} ${className}`,
    texts: [
      // box header (type)
      {
        x: boxCenter,
        y: initialY + Cfg.layout.entity.header.height * 0.5,
        text: data.getClassLabel(),
        className: 'type',
      },
      // box header (name of entity)
      ... headerLines,
      // description
      ... lines
    ],
  };

  // attach box to the actual entry
  data.box = box;

  return box;

}


/**
 * @typedef TextLineLayout
 * @property  {number}    x
 * @property  {number}    y
 * @property  {string}    text
 * @property  {string}    className
 */

/**
 * return the proper layout for this text fragment,
 * possibly breaking it into multiple lines
 *
 * @param   {object}  p
 * @param   {string}  p.text
 * @param   {number}  p.startY
 * @param   {number}  p.boxWidth
 * @param   {number}  p.boxCenter
 * @returns {Array<TextLineLayout>}
 */
export function layoutText({ text, startY, boxWidth, boxCenter }) {

  /** @type {Array<TextLineLayout>} */
  const lines = [];

  // split description until it fits the box width
  let commentWidth = getTextDims( text );
  let comment = [ text ];
  let newComment = [];
  const maxWidth = boxWidth - 2 * Cfg.layout.entity.textMargin;
  while( commentWidth.width > maxWidth ) {

    // next split
    newComment = splitText( text, comment.length + 1 );

    // proceed if nothing changed anymore
    if( newComment.length == comment.length ) {
      break;
    }
    comment = newComment;

    // max line length
    commentWidth = comment.reduce( (max, el) => {
      const dims = getTextDims( el );
      return dims.width > max.width ? dims : max;
    }, { width: 0 } );

  }

  // add all lines of the description
  startY += Cfg.layout.lineHeight;
  for( const line of comment ) {
    lines.push({
      x: boxCenter,
      y: startY,
      text:       line,
      className:  'desc',
    });
    startY += Cfg.layout.lineHeight;
  }

  return lines;
}


/**
 *
 * @param {Entity}  parent
 * @param {any}     result
 */
function layoutConstraints(parent, result) {

  // shortcut
  const constraints = parent.getConstraints();
  if( !parent.isSystem() && (constraints.length < 1) ) {
    return parent.box.y + parent.box.height;
  }

  // set starting vertical value
  let startY = parent.startY
                  ?? parent.box.y + parent.box.height
                      + Cfg.layout.entity.vertMarginSmall;

  // in case of system, process all components first
  if( parent.isSystem() ) {

    // process components
    const sysComponents = parent.getComponents();
    let newStartY = startY; // startY modified by constraints of components
    for( const key of Object.keys( sysComponents ) ) {
      for( const sysComp of sysComponents[ key ] ) {
        newStartY = Math.max(
          layoutConstraints( sysComp, result ),
          newStartY
        );
      }
    }

    // if any component had constraints, leave some more space
    if( newStartY && (startY != newStartY) ) {
      startY = newStartY += Cfg.layout.entity.vertMarginTiny;
    }

  }

  let first = true; // highlight first constraint in case we have multiple ones
  for( const constraint of constraints ) {

    // copy part of the dimensions from parent box (aka the entity being constrained)
    // TODO layout in case multiple entities are constrained by a single constraint
    constraint.x = parent.box.x;
    constraint.width = parent.box.width;

    // add the box
    const box = getBox( 'Constraint', constraint, startY );
    result.boxes.push( box );

    // add the corresponding arrow
    let arrow;
    if( first ) {

      // full arrow only for the first constraint
      arrow = {
        text: ARROW_LABELS.constrains,
        path: [
          { x: box.x + 0.5 * box.width, y: box.y },
          {
            x: parent.box.x + 0.5 * parent.box.width,
            y: parent.box.y + parent.box.height + 6
          },
        ],
        x:    box.x + 0.5 * box.width,
        y:    parent.box.y + parent.box.height + 0.5 * Cfg.layout.entity.vertMarginSmall + 5,
        dim:  getTextDims( ARROW_LABELS.constrains ),
        type: 'constrains',
      };

      // adjust parent start, if more constraints are coming
      startY = box.y + box.height + Cfg.layout.entity.vertMarginTiny;

      // there can only be one first element
      first = !first;

    } else {

      // later ones get only a path fragment
      arrow = {
        path: [
          { x: box.x + 0.5 * box.width, y: box.y },
          {
            x: parent.box.x + 0.5 * parent.box.width,
            y: startY - Cfg.layout.entity.vertMarginTiny, // account for the distance to next-higher box
          },
        ],
        x:    box.x + 0.5 * box.width,
        y:    parent.box.y + parent.box.height + 0.5 * Cfg.layout.entity.vertMarginSmall + 5,
        type: 'constrains',
        hideHead: true,
      };

    }
    result.arrows.push( arrow );

    // adjust parent start, if more constraints are coming
    startY = box.y + box.height + Cfg.layout.entity.vertMarginTiny;

  }

  return startY;

}



/**
 * return the list of components in the requested order
 * @param   {Variable} data     Variable description
 * @param   {string}   order    order of components
 * @returns {Entity[]}
 */
function getComponents( data, order ) {

  const result = [];
  for( const l of order.toLowerCase() ) {
    switch( l ) {

      case 'c':
        result.push( ... data.getContextObjects() );
        break;

      case 'm':
        result.push( data.getMatrix() );
        break;

      case 'o':
        result.push( data.getObjectOfInterest() );
        break;

      case 'p':
        result.push( data.getProperty() );
        break;

      case 's':
        result.push( data.getStatisticalModifier() );
        break;

      default:
        throw new Error( `Unknown order modifier "${l}"` );

    }
  }

  return result. filter( (c) => c );
}