import Cfg from './config.js';
import calcBoxWidth from './createLayout/equalWidth.js';
import getTextDims from './createLayout/getTextDims.js';
import splitText from './createLayout/splitText.js';

// labels for arrows connecting Variable and the direct properties
const ARROW_LABELS = {
  prop:     'hasProperty',
  matrix:   'hasMatrix',
  context:  'hasContextObject',
  ooi:      'hasObjectOfInterest',
};

/**
 * do the layout for a single Variable
 * @param   {object} data   Variable description
 * @returns {object}        computed layout
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

  // calculate widths for each box
  calcBoxWidth([ ... data.matrix, ... data.ooi, ... data.context, ... data.prop ]);

  // entries for all single valued components
  for( const key of [ 'prop', 'matrix', 'ooi' ] ) {
    if( (key in data) && (data[key].length > 0) ) {

      // add the box
      box = getBox( key == 'prop' ? 'Property' : 'Entity', data[key][0], startY );
      result.boxes.push( box );

      // add the corresponding arrow
      arrow = {
        text: ARROW_LABELS[ key ],
        path: [
          { x: box.x + 0.5 * box.width, y: variableBox.y + variableBox.height },
          { x: box.x + 0.5 * box.width, y: box.y - 6 },
        ],
        x:    box.x + 0.5 * box.width,
        y:    variableBox.y + variableBox.height + 0.5 * (box.y - variableBox.y - variableBox.height),
        dim:  getTextDims( ARROW_LABELS[ key ] ),
        type: key,
      };
      result.arrows.push( arrow );

    }
  }

  return result;

}


/**
 * gather the full layout-data for a box
 * @param   {string} type       type of the box
 * @param   {object} data       description
 * @param   {number} initialY   starting y-coordinate for this level of boxes
 * @returns {object}            layout data
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
  let startY = initialY + 2.5 * Cfg.layout.entity.header.height;;

  // append description, if available
  if( data.comment && (data.comment.length > 0) ) {

    // split description until it fits the box width
    let commentWidth = getTextDims( data.comment[0].value );
    let comment = [ data.comment[0].value ];
    const maxWidth = boxWidth - 2 * Cfg.layout.entity.textMargin;
    while( commentWidth.width > maxWidth ) {

      // next split
      comment = splitText( data.comment[0].value, comment.length + 1 );

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

    startY += Cfg.layout.entity.textMargin;
  }

  // append prefixed IRI, if available
  if( data.shortIri ) {
    lines.push({
      x: boxCenter,
      y: startY,
      text:       data.shortIri,
      className:  'desc',
      link:       data.iri ?? data.value,
    });
    startY += Cfg.layout.lineHeight;
  }

  // overall height of the variable box
  const height = Cfg.layout.entity.header.height * 2
      + Cfg.layout.entity.textMargin * 2
      + lines.length * Cfg.layout.lineHeight;

  // base entry for the box
  const box = {
    x:      data.x ?? Cfg.layout.margin,
    width:  boxWidth,
    y:      initialY,
    height: startY - initialY + Cfg.layout.entity.textMargin,
    className: type.toLowerCase(),
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
        text: data.label?.[0]?.value,
        className: 'title',
      },
      // description
      ... lines
    ],
  };

  return box;

}
