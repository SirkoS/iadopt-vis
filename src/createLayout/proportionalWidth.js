import Cfg from '../config.js';
import { minTextWidth, getTextDims } from './getTextDims.js';

/**
 * horizontally layout for a given set of boxes
 *
 * proportional-width-layout:
 * - split horizontal space according to text width of each box
 * - includes all texts within a box
 * - might include splitting text into multiple lines
 *
 * @param   {Array.<object>}  boxes   boxes to calculate the width for
 * @returns {Array.<object>}          modified boxes including width statements
 */
export default function calcBoxWidth( boxes ) {

  // effective total width accounts for outer margins and the distance between the boxes
  const effWidth = Cfg.layout.width
                    - 2 * Cfg.layout.margin
                    - (boxes.length - 1) * Cfg.layout.entity.horMargin;

  // initialize width for each box
  const dynBoxes = boxes.map( (b) => ({
    box:        b,
    minWidth:   getMaxLabelWidth( b ),  // minimum width as per labels
    width:      0,                      // currently assigned width as per share of total
  }));

  // split texts within a box until everyone has enough space
  while( !splitWidth( effWidth, dynBoxes ) ) {
    // TODO
    console.log( 'TODO' );
    return;
  }

  // assign the final width to all boxes
  let leftStart = Cfg.layout.margin;
  for( let i=0; i<dynBoxes.length; i++ ) {

    dynBoxes[i].box.x     = leftStart;
    dynBoxes[i].box.width = dynBoxes[i].width;

    leftStart += Cfg.layout.entity.horMargin + dynBoxes[i].width;

  }

  return boxes;

}

/**
 * get the current width of labels in a box
 * @param {object} box the box to consider
 * @returns current max width of labels in that box
 */
function getMaxLabelWidth( box ) {
  return Math.max(
    minTextWidth,                               // never go below the minimum
    getTextDims( box.label[0].value ).width,    // the actual name
    getTextDims( box.shortIRI, 'desc' ).width,  // the IRI
  );
}

/**
 * distribute the total width over the given boxes proportionally
 *
 * @param   {number}          total     the total width that may be used for boxes
 * @param   {array.<object>}  dynBoxes  the boxes to be distributed
 * @returns {boolean}                   do all boxes no have enough width to hold their labels?
 */
function splitWidth( total, dynBoxes ){

  // sum of label widths
  const totalLabelWidth = dynBoxes.reduce( (sum, b) => sum + b.minWidth, 0 );

  // assign current widths
  for( const box of dynBoxes ) {
    box.width = box.minWidth * total / totalLabelWidth;
  }

  // validate that each box's width is enough to hold all current labels
  for( const box of dynBoxes ) {
    if( box.minWidth + 2 * Cfg.layout.entity.minPadding > box.width ) {
      return false;
    }
  }
  return true;

}
