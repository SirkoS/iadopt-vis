import Cfg from './config';

const SVG_NS = 'http://www.w3.org/2000/svg';

// hard-wired dimensions of arrow labels, so we can mask a part of the corresponding arrows
// can not easily determine the dimensions of the labels dynamically, so we use hard coded values here
// need to be updated in case labels' font-size is changed
const LABEL_DIM = {
  prop:     { width:  75, height: 14, },
  matrix:   { width:  65, height: 14, },
  context:  { width: 105, height: 14, },
  ooi:      { width: 120, height: 14, },
};

/**
 * render a given layout into a div
 * @param {HTMLElement} div     DOM div element to render the SVG in
 * @param {object}      layout  the layout to render
 */
export default function draw( div, layout ) {

  // get overall SVG height
  const height = Cfg.layout.margin // margin on bottom; top-margin is included in the box layouts
    + Math.max( ... layout.boxes.map( (el) => el.y + el.height ) ); // last y-coordinate of a box

  // main SVG container
  const svg = createElement( 'svg', {
    'viewBox': `0 0 ${Cfg.layout.width} ${height}`
  });

  // some fixed components
  const defs = createElement( 'defs' );
  defs.innerHTML = `
<marker id="arrowHeadEnd"
  viewBox="0 0 10 10" refX="5" refY="5"
  markerUnits="strokeWidth"
  markerWidth="15" markerHeight="15"
  orient="auto">
  <path d="M 1,1 l 7,4 l -7,4 2,-4 z" style="fill: black"/>
</marker>
  `;
  svg.appendChild( defs );

  // draw all arrows
  for( const arr of layout.arrows ) {

    // structuring element
    const container = createElement( 'g', {
      class: 'arrow',
    } );

    // arrow
    const path = arr.path.map( (el) => `${el.x},${el.y}` );
    container.appendChild( createElement( 'path', {
      d:      `M ${path.join(' ')}`,
      style:  'marker-end: url(#arrowHeadEnd);',
    }) );

    // arrow label
    const textEl = createElement( 'text', {
      x: arr.x,
      y: arr.y,
    });
    textEl.innerHTML = arr.text;
    container.appendChild( textEl );

    // add to DOM
    svg.appendChild( container );

  }

  // draw all entities
  for( const box of layout.boxes ) {

    // structuring element
    const container = createElement( 'g', {
      class: box.className,
    } );

    // --- boxes ---

    // header
    container.appendChild( createElement( 'rect', {
      x:      box.x,
      y:      box.y,
      width:  box.width,
      height: Cfg.layout.entity.header.height,
      class:  'header',
    }) );

    // title
    container.appendChild( createElement( 'rect', {
      x:      box.x,
      y:      box.y + Cfg.layout.entity.header.height,
      width:  box.width,
      height: Cfg.layout.entity.header.height,
      class:  'title',
    }) );

    // --- wireframe ---
    container.appendChild( createElement( 'path', {
      d:      `M ${box.x},${box.y} l ${box.width},0 0,${box.height} -${box.width},0 z
               M ${box.x},${box.y + Cfg.layout.entity.header.height} l ${box.width},0`,
      class:  'frame',
    }) );


    // any attached text
    for( const text of box.texts ) {

      const textEl = createElement( 'text', {
        x:      text.x,
        y:      text.y,
        class:  text.className,
      });
      if( text.link ) {
        const anchor = createElement( 'a', {
          href:   text.link,
          target: '_blank',
        });
        anchor.innerHTML = text.text;
        textEl.appendChild( anchor );
      } else {
        textEl.innerHTML = text.text;
      }
      container.appendChild( textEl );

    }

    // add to DOM
    svg.appendChild( container );

  }

  // add everything to the DOM
  div.innerHTML = '';
  div.appendChild( svg );

}

/**
 * shorthand to create an SVG element
 * @param {string} name   tagName of the element to create
 * @param {object} attr   key-value list of the attributes to add
 */
function createElement( name, attr = {} ) {

  const el = document.createElementNS( SVG_NS, name );
  for( const [key, value] of Object.entries( attr ) ) {
    el.setAttribute( key, value );
  }
  return el;

}
