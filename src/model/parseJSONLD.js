import { Constraint, Entity, Property, VALID_SYSTEM_PROPERTIES, Variable } from './models.js';

/**
 * @returns {Variable}
 */
export default function parseJSONLD( data ) {

  // parse main variable content
  const variable = new Variable({
    iri: data['@id'],
    label: data['label'],
    comment: data['comment'],
  });

  // parse components
  const lookup = {};
  let item = data['property'];
  let ent = parseConcept( item, Property, lookup );
  if (ent) {
    variable.setProperty( ent );
  }
  item = data['statmod'] ?? data['statisticalModifier'] ?? data['statMod'] ?? data['statisticalModifier'];
  ent = parseConcept( item, Entity, lookup );
  if (ent) {
    variable.setStatisticalModifier( ent );
  }
  item = data['ooi'] ?? data['objectofinterest'];
  ent = parseConcept( item, Entity, lookup );
  if (ent) {
    variable.setObjectOfInterest( ent );
  }
  item = data['matrix'];
  ent = parseConcept( data['matrix'], Entity, lookup );
  if (ent) {
    variable.setMatrix( ent );
  }
  item = data['context'] ?? data['contextobject'];
  if( item ) {
    if( Array.isArray( item ) ) {
      for( const d of data['context'] ) {
        ent = parseConcept( d, Entity, lookup );
        variable.addContextObject( ent );
      }
    } else {
      ent = parseConcept( d, Entity, lookup );
      variable.addContextObject( ent );
    }
  }

  // parse constraints
  if( data['constraint'] ) {
    for( const c of data['constraint'] ) {
      let { constraint, entities } = parseConstraint( c );
      entities = entities.map( (e) => lookup[e] );
      variable.addConstraint( constraint, ... entities );
    }
  }

  return variable;
}


/**
 * parse a single Entity from JSON
 *
 * @param {Object}                    data
 * @param {T extends Entity}          Type the class to parse into
 * @param {Object.<string, Entity>}   lookup
 * @returns {T}
 */
function parseConcept( data, Type, lookup ) {

  // no data given
  if (!data) {
    return;
  }

  // basic structure
  const result = new Type({
    iri:      data['@id'],
    label:    data['label'],
    comment:  data['comment'],
    isBlank:  !('@id' in data) || data['@id'].startsWith( '_:' ),
  });
  lookup[ data['@id'] ] = result;

  // check for components
  for( const systemProp of VALID_SYSTEM_PROPERTIES ) {
    if( systemProp in data ) {

      // parse components
      const components = Array.isArray( data[ systemProp ] )
        ? data[ systemProp ].map( (p) => parseConcept( p, Type, lookup ) )
        : [ parseConcept( data[systemProp], Type, lookup ) ];

      // attach to result
      for( const comp of components ) {
        result.addComponent( systemProp, comp );
        lookup[ comp.getIri() ] = comp;
      }

    }
  }

  return result;

}


function parseConstraint( data ) {

  // no data given
  if (!data) {
    return;
  }

  return {
    constraint: new Constraint({
      iri: data['@id'],
      label: data['label'],
      comment: data['comment'],
    }),
    entities: data['constrains'],
  };

}