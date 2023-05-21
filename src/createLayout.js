import Cfg from './config.js';

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

  let box;

  // memorize the starting y-coordinate for each box
  let startY = Cfg.layout.margin;

  // the Variable itself
  box = getBox( 'Variable', data, startY );
  result.boxes.push( box );
  startY += box.height;

  // second row of elements
  startY += Cfg.layout.entity.vertMargin;

  // all single valued components
  for( const key of [ 'prop', 'matrix', 'ooi' ] ) {
    if( (key in data) && (data[key].length > 0) ) {
      box = getBox( key == 'prop' ? 'Property' : 'Entity', data[key][0], startY );
      result.boxes.push( box );
      startY += box.height + Cfg.layout.margin;
    }
  }

  return result;

}


function getBox( type, data, startY ) {

  // prepare description texts
  const lines = [];

  // append additional description lines, if applicable
  if( data.shortIri ) {
    lines.push({
      x: Cfg.layout.width * 0.5,
      y: startY + 2.5 * Cfg.layout.entity.header.height,
      text:       data.shortIri,
      className:  'desc',
      link:       data.iri ?? data.value,
    });
  }

  // overall height of the variable box
  const height = Cfg.layout.entity.header.height * 2
      + Cfg.layout.entity.textMargin * 2
      + lines.length * Cfg.layout.lineHeight;

  // base entry for the box
  const box = {
    x:      Cfg.layout.margin,
    width:  Cfg.layout.width - 2 * Cfg.layout.margin,
    y:      startY,
    height: height,
    className: type.toLowerCase(),
    texts: [
      // box header (type)
      {
        x: Cfg.layout.width * 0.5,
        y: startY + Cfg.layout.entity.header.height * 0.5,
        text: type,
        className: 'type',
      },
      // box header (name of entity)
      {
        x: Cfg.layout.width * 0.5,
        y: startY + Cfg.layout.entity.header.height * 1.5,
        text: data.label?.[0]?.value,
        className: 'title',
      },
      // description
      ... lines
    ],
  };



  return box;
}