import Cfg from './config.js';
import calcBoxWidth from './createLayout/equalWidth.js';
import getTextDims from './createLayout/getTextDims.js';
import splitText from './createLayout/splitText.js';
import { Entity, Property, Variable } from './model/models.js';

// labels for arrows connecting Variable and the direct properties
const ARROW_LABELS = {
  'Property':     'hasProperty',
  'Matrix':       'hasMatrix',
  'ContextObject':'hasContextObject',
  'OoI':          'hasObjectOfInterest',
  constrains:     'constrains',
  hasconstraint:  'hasConstraint',
};

/**
 * do the layout for a single Variable
 * @param   {Variable} data   Variable description
 * @returns {object}          computed layout
 */
export default function createLayout( data ) {

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
  const components = [
    data.getObjectOfInterest(),
    data.getMatrix(),
    ... data.getContextObjects(),
    data.getProperty()
  ]. filter( (c) => c );

  // calculate widths for each box
  calcBoxWidth( components );

  // entries for all single valued components
  for( const obj of components ) {

    // add the box
    box = getBox( obj instanceof Property ? 'Property' : 'Entity', obj, startY );
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

  }

  // add constraints
  for( const constraint of data.getConstraints() ) {

    // copy part of the dimensions from parent box (aka the entity being constrained)
    // TODO layout in case multiple entities are constrained by a single constraint
    const parent = constraint.getEntities()[0];
    constraint.x = parent.box.x;
    constraint.width = parent.box.width;

    // determine where to start vertically
    const startY = parent.startY
                    ?? parent.box.y + parent.box.height
                       + Cfg.layout.entity.vertMarginSmall;

    // add the box
    box = getBox( 'Constraint', constraint, startY );
    result.boxes.push( box );

    // add the corresponding arrow
    if( !parent.startY ) {

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
        y:    parent.box.y + parent.box.height + 0.5 * (box.y - parent.box.y - parent.box.height) + 5,
        dim:  getTextDims( ARROW_LABELS.constrains ),
        type: 'constrains',
      };

    } else {

      // later ones get only a path fragment
      arrow = {
        path: [
          { x: box.x + 0.5 * box.width, y: box.y },
          {
            x: parent.box.x + 0.5 * parent.box.width,
            y: parent.startY - Cfg.layout.entity.vertMarginTiny, // account for the distance to next-higher box
          },
        ],
        x:    box.x + 0.5 * box.width,
        y:    parent.box.y + parent.box.height + 0.5 * (box.y - parent.box.y - parent.box.height) + 5,
        type: 'constrains',
        hideHead: true,
      };

    }
    result.arrows.push( arrow );

    // adjust parent start, if more constraints are coming
    parent.startY = box.y + box.height + Cfg.layout.entity.vertMarginTiny;

  }

  // add hasConstraint arrows, if needed
  const entities = components.filter( (c) => c instanceof Entity );
  for( const parent of entities ) {

    // skip for entities without constraints
    const constraints = parent.getConstraints();
    if( !constraints.length ) {
      continue;
    }

    // add arrow to first constraint (includes label)
    const x = parent.box.x + parent.box.width + 0.5 * Cfg.layout.entity.horMargin;
    let constraint = constraints[0];
    arrow = {
      text: ARROW_LABELS.hasconstraint,
      path: [
        { x: x, y: variableBox.y + variableBox.height },
        { x: x, y: constraint.box.y + 0.5 * constraint.box.height },
        { x: x - 0.5 * Cfg.layout.entity.horMargin + 6, y: constraint.box.y + 0.5 * constraint.box.height },
      ],
      x:    x,
      y:    variableBox.y + variableBox.height + 0.5 * (parent.box.y - variableBox.y - variableBox.height) + 20,
      dim:  getTextDims( ARROW_LABELS.hasconstraint ),
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

  return result;

}


/**
 * gather the full layout-data for a box
 * @param   {string}    type        type of the box
 * @param   {Variable}  data        description
 * @param   {number}    initialY    starting y-coordinate for this level of boxes
 * @returns {object}                layout data
 */
function getBox( type, data, initialY ) {

  // center of the box as point of alignment for texts
  // default is based on entire width of visualization
  const boxCenter = (data.x ?? Cfg.layout.margin)
    + 0.5 * (data.width ?? (Cfg.layout.width - 2 * Cfg.layout.margin));

  // width of the box is either given or uses all available space
  const boxWidth = data.width ?? (Cfg.layout.width - 2 * Cfg.layout.margin);

  // prepare description texts
  const lines = [];
  let startY = initialY + 2.5 * Cfg.layout.entity.header.height;

  // append prefixed IRI, if available
  if( data.getShortIri() ) {
    lines.push({
      x: boxCenter,
      y: startY,
      text:       data.getShortIri(),
      className:  'desc',
      link:       data.getIri(),
    });
    startY += Cfg.layout.lineHeight;
  }
  let descSeparator = startY;

  // append description, if available
  if( data.getComment() ) {

    // split description until it fits the box width
    let commentWidth = getTextDims( data.getComment() );
    let comment = [ data.getComment() ];
    const maxWidth = boxWidth - 2 * Cfg.layout.entity.textMargin;
    while( commentWidth.width > maxWidth ) {

      // next split
      comment = splitText( data.getComment(), comment.length + 1 );

      // max line length
      commentWidth = comment.reduce( (max, el) => {
        const dims = getTextDims( el );
        return dims.width > max.width ? dims : max;
      }, { width: 0 } );

    }

    // add all lines of the description
    for( const line of comment ) {
      lines.push({
        x: boxCenter,
        y: startY,
        text:       line,
        className:  'desc',
      });
      startY += Cfg.layout.lineHeight;
    }

  }

  // do we need the separator between IRI and an additional description?
  descSeparator = data.getShortIri() && data.getComment()
    ? descSeparator
    : null;

  // if there's no description, remove the space again
  if( lines.length < 1 ) {
    startY -= 0.5 * Cfg.layout.entity.header.height;
  }

  // base entry for the box
  const box = {
    x:              data.x ?? Cfg.layout.margin,
    width:          boxWidth,
    y:              initialY,
    height:         startY - initialY,
    descSeparator:  descSeparator,
    className:      type.toLowerCase(),
    texts: [
      // box header (type)
      {
        x: boxCenter,
        y: initialY + Cfg.layout.entity.header.height * 0.5,
        text: type,
        className: 'type',
      },
      // box header (name of entity)
      {
        x: boxCenter,
        y: initialY + Cfg.layout.entity.header.height * 1.5,
        text: data.getLabel(),
        className: 'title',
        link: data.getShortIri() ? undefined : data.getIri(),
      },
      // description
      ... lines
    ],
  };

  // attach box to the actual entry
  data.box = box;

  return box;

}
