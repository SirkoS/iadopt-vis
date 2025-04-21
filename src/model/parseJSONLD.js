import { Concept, Constraint, Entity, Property, VALID_SYSTEM_PROPERTIES, Variable } from './models.js';

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
  let ent = parseConcept( data['property'], Property, lookup );
  if (ent) {
    variable.setProperty( ent );
  }
  ent = parseConcept( data['statisticalModifier'], Entity, lookup );
  if (ent) {
    variable.setStatisticalModifier( ent );
  }
  ent = parseConcept( data['ooi'], Entity, lookup );
  if (ent) {
    variable.setObjectOfInterest( ent );
  }
  ent = parseConcept( data['matrix'], Entity, lookup );
  if (ent) {
    variable.setMatrix( ent );
  }
  if( data['context'] ) {
    for( const d of data['context'] ) {
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
    iri: data['@id'],
    label: data['label'],
    comment: data['comment'],
  });
  lookup[ result.getIri() ] = result;

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