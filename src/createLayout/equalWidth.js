import Cfg from '../config.js';
import getTextDims from './getTextDims.js';

/**
 * horizontally layout for a given set of boxes
 *
 * equal-width-layout:
 * - all boxes have the same width
 *
 * @param   {Array.<object>}  boxes   boxes to calculate the width for
 * @returns {Array.<object>}          modified boxes including width statements
 */
export default function calcBoxWidth( boxes ) {

  // effective total width accounts for outer margins
  const effWidth = Cfg.layout.width - 2 * Cfg.layout.margin;

  // calc width
  // for each box assign one horMargin and then compensate for the one superfluous one
  const width =
      (effWidth + Cfg.layout.entity.horMargin) / boxes.length
      - Cfg.layout.entity.horMargin;

  // assign to all boxes
  for( const [ index, box ] of Object.entries( boxes ) ) {
    box.width = width;
    box.x = Cfg.layout.margin                                     // outer margin
            + index * ( width + Cfg.layout.entity.horMargin );   // previous boxes in that row
  }

  return boxes;

}
