import Cfg from '../../config.js';
import { Entity } from '../../model/models.js';

/**
 * horizontally layout for a given set of boxes
 *
 * equal-width-layout:
 * - all boxes have the same width
 *
 * @param   {Array.<Entity>}  boxes   boxes to calculate the width for
 * @returns {Array.<Entity>}          modified boxes including width statements
 */
export default function calcBoxWidth( boxes ) {

  // effective total width accounts for outer margins
  const effWidth = Cfg.layout.width - 2 * Cfg.layout.margin - Cfg.layout.entity.horMargin;

  // get number of horizontal lanes
  // system get the sum of their components
  const boxCount = boxes.reduce( (sum, b) => sum + (b.isSystem() ? b.getComponentCount() : 1), 0 );

  // calc width
  // for each box assign one horMargin and then compensate for the one superfluous one
  const width =
      (effWidth + Cfg.layout.entity.horMargin) / boxCount
      - Cfg.layout.entity.horMargin;

  // assign to all boxes
  let left = 0;
  for( const box of boxes ) {

    if( box.isSystem() ) {

      // how many components are subsumed by this system
      const compCount = box.getComponentCount();

      // box dimensions
      box.width = width * compCount                                   // component widths
                  + Cfg.layout.entity.horMargin * (compCount -1);     // margin between components
      box.x = Cfg.layout.margin                             // outer margin
                  + 0.5 * Cfg.layout.entity.horMargin       // horizontal margin to account for Constraints on Properties
                  + left;                                   // previous boxes in that row

      // process all components
      for( const comp of Object.values( box.getComponents() ).flatMap( (s) => s ) ) {

        comp.width = width;
        comp.x = Cfg.layout.margin                        // outer margin
                + 0.5 * Cfg.layout.entity.horMargin       // horizontal margin to account for Constraints on Properties
                + left;                                   // previous boxes in that row

        // increase for next box
        left += width + Cfg.layout.entity.horMargin;


      }

    } else {

      // box dimensions
      box.width = width;
      box.x = Cfg.layout.margin                         // outer margin
              + 0.5 * Cfg.layout.entity.horMargin       // horizontal margin to account for Constraints on Properties
              + left;                                   // previous boxes in that row

      // increase for next box
      left += width + Cfg.layout.entity.horMargin;

    }
  }

  return boxes;

}
